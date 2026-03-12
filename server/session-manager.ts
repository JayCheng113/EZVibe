import * as pty from 'node-pty';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

const DB_DIR = path.join(os.homedir(), '.ezvibe');
const DB_PATH = path.join(DB_DIR, 'ezvibe.db');
const BUFFER_CAP = 100 * 1024; // 100KB

export type DetailedStatus = 'active' | 'waiting' | 'idle' | 'dead';

export interface ManagedSession {
  id: string;
  ideaId: string;
  pty: pty.IPty;
  pid: number;
  status: 'starting' | 'active' | 'dead';
  detailedStatus: DetailedStatus;
  buffer: string;
  sockets: Set<string>;
  cwd: string;
  startedAt: string;
  lastOutputAt: number;
  idleCheckInterval?: ReturnType<typeof setInterval>;
}

type SessionStatus = ManagedSession['status'];

export class SessionManager {
  private sessions: Map<string, ManagedSession> = new Map();
  private db: Database.Database;

  // Callback for notifying sockets when a session exits
  onSessionExit?: (sessionId: string, code: number) => void;
  onSessionError?: (sessionId: string, message: string) => void;
  onStatusChange?: (sessionId: string, status: DetailedStatus) => void;

  constructor() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  createSession(ideaId: string, cwd: string): ManagedSession {
    // Validate cwd exists
    if (!fs.existsSync(cwd)) {
      throw new Error(`Directory does not exist: ${cwd}`);
    }

    const stat = fs.statSync(cwd);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${cwd}`);
    }

    const sessionId = uuidv4();
    const shell = process.env.SHELL || '/bin/zsh';
    const startedAt = new Date().toISOString();
    const spawnTime = Date.now();

    // Resolve claude path - check common locations
    let claudePath = 'claude';
    const homedir = os.homedir();
    const candidates = [
      path.join(homedir, '.npm-global', 'bin', 'claude'),
      path.join(homedir, '.local', 'bin', 'claude'),
      '/usr/local/bin/claude',
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        claudePath = candidate;
        break;
      }
    }

    // Build clean env: remove all Claude Code env vars to avoid nested-session detection
    const cleanEnv: { [key: string]: string } = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (v !== undefined && !k.startsWith('CLAUDE')) {
        cleanEnv[k] = v;
      }
    }
    cleanEnv.TERM = 'xterm-256color';
    cleanEnv.COLORTERM = 'truecolor';

    const ptyProcess = pty.spawn(claudePath, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd,
      env: cleanEnv,
    });

    const session: ManagedSession = {
      id: sessionId,
      ideaId,
      pty: ptyProcess,
      pid: ptyProcess.pid,
      status: 'starting',
      detailedStatus: 'active',
      buffer: '',
      sockets: new Set(),
      cwd,
      startedAt,
      lastOutputAt: Date.now(),
    };

    this.sessions.set(sessionId, session);

    // Register PTY data handler
    ptyProcess.onData((data: string) => {
      this.appendToBuffer(session, data);
      session.lastOutputAt = Date.now();
      if (session.status === 'starting') {
        this.updateStatus(session, 'active');
      }

      // Detect detailed status from output patterns
      const newDetailed = this.detectDetailedStatus(data);
      if (newDetailed !== session.detailedStatus) {
        session.detailedStatus = newDetailed;
        if (this.onStatusChange) {
          this.onStatusChange(session.id, newDetailed);
        }
      }
    });

    // Periodic idle check every 5 seconds
    session.idleCheckInterval = setInterval(() => {
      if (session.status === 'dead') return;
      if (Date.now() - session.lastOutputAt > 10000 && session.detailedStatus !== 'idle') {
        session.detailedStatus = 'idle';
        if (this.onStatusChange) {
          this.onStatusChange(session.id, 'idle');
        }
      }
    }, 5000);

    // Register PTY exit handler
    ptyProcess.onExit(({ exitCode }) => {
      const elapsed = Date.now() - spawnTime;
      this.updateStatus(session, 'dead');

      // Clean up idle check interval
      if (session.idleCheckInterval) {
        clearInterval(session.idleCheckInterval);
        session.idleCheckInterval = undefined;
      }

      // Update detailed status to dead
      session.detailedStatus = 'dead';
      if (this.onStatusChange) {
        this.onStatusChange(session.id, 'dead');
      }

      // Early exit detection
      if (elapsed < 3000 && this.onSessionError) {
        this.onSessionError(sessionId, `Process exited early (code ${exitCode}) after ${elapsed}ms`);
      }

      if (this.onSessionExit) {
        this.onSessionExit(sessionId, exitCode);
      }
    });

    // Store in DB
    try {
      this.db.prepare(
        `INSERT INTO sessions (id, idea_id, pid, status, cwd, started_at) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(sessionId, ideaId, ptyProcess.pid, 'starting', cwd, startedAt);
    } catch (err) {
      console.error('Failed to insert session into DB:', err);
    }

    return session;
  }

  getSession(sessionId: string): ManagedSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionByIdeaId(ideaId: string): ManagedSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.ideaId === ideaId && session.status !== 'dead') {
        return session;
      }
    }
    return undefined;
  }

  getAllSessions(): ManagedSession[] {
    return Array.from(this.sessions.values());
  }

  killSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status === 'dead') return;

    try {
      session.pty.kill('SIGTERM');
    } catch {
      // PTY may already be dead
    }

    // After 2s, force kill if still alive
    setTimeout(() => {
      if (session.status !== 'dead') {
        try {
          session.pty.kill('SIGKILL');
        } catch {
          // Already dead
        }
        this.updateStatus(session, 'dead');
        if (session.idleCheckInterval) {
          clearInterval(session.idleCheckInterval);
          session.idleCheckInterval = undefined;
        }
      }
    }, 2000);
  }

  writeToSession(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status === 'dead') return;
    session.pty.write(data);
  }

  resizeSession(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status === 'dead') return;
    try {
      session.pty.resize(cols, rows);
    } catch {
      // PTY may be dead
    }
  }

  getBuffer(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    return session?.buffer ?? '';
  }

  addSocket(sessionId: string, socketId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sockets.add(socketId);
    }
  }

  removeSocket(sessionId: string, socketId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sockets.delete(socketId);
    }
  }

  shutdown(): void {
    console.log(`Shutting down ${this.getActiveSessionCount()} active session(s)...`);

    for (const session of this.sessions.values()) {
      if (session.status !== 'dead') {
        // Send SIGHUP first (graceful), then SIGKILL as fallback
        try {
          console.log(`  Sending SIGHUP to session ${session.id} (pid ${session.pid})`);
          session.pty.kill('SIGHUP');
        } catch {
          // PTY may already be dead
        }

        // Force kill after a short delay
        try {
          session.pty.kill('SIGKILL');
        } catch {
          // Already dead
        }

        session.status = 'dead';
        session.detailedStatus = 'dead';
        if (session.idleCheckInterval) {
          clearInterval(session.idleCheckInterval);
          session.idleCheckInterval = undefined;
        }
        try {
          this.db.prepare(
            `UPDATE sessions SET status = 'dead', ended_at = ? WHERE id = ?`
          ).run(new Date().toISOString(), session.id);
        } catch {
          // Ignore DB errors during shutdown
        }
      }
    }

    console.log('All sessions terminated.');
    this.sessions.clear();
    try {
      this.db.close();
      console.log('Database connection closed.');
    } catch {
      // Ignore
    }
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.status !== 'dead') count++;
    }
    return count;
  }

  // Regex to detect prompt-like patterns at the end of output
  private static PROMPT_PATTERN = /(?:❯|>\s*$|\$\s*$|⏎|claude\s*>)/m;

  private detectDetailedStatus(data: string): DetailedStatus {
    // Check the last portion of output for prompt patterns
    const tail = data.slice(-200);
    if (SessionManager.PROMPT_PATTERN.test(tail)) {
      return 'waiting';
    }
    return 'active';
  }

  private appendToBuffer(session: ManagedSession, data: string): void {
    session.buffer += data;
    if (session.buffer.length > BUFFER_CAP) {
      session.buffer = session.buffer.slice(session.buffer.length - BUFFER_CAP);
    }
  }

  private updateStatus(session: ManagedSession, status: SessionStatus): void {
    session.status = status;
    try {
      if (status === 'dead') {
        this.db.prepare(
          `UPDATE sessions SET status = ?, ended_at = ? WHERE id = ?`
        ).run(status, new Date().toISOString(), session.id);
      } else {
        this.db.prepare(
          `UPDATE sessions SET status = ? WHERE id = ?`
        ).run(status, session.id);
      }
    } catch (err) {
      console.error('Failed to update session status in DB:', err);
    }
  }
}
