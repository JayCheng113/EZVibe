import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { SessionManager } from './session-manager';
import { registerSocketHandlers } from './socket-handlers';

const PORT = 3001;
const HOST = '127.0.0.1';
const AUTH_DIR = path.join(os.homedir(), '.ezvibe');
const AUTH_TOKEN_PATH = path.join(AUTH_DIR, '.auth-token');

// Generate random auth token and write to file
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}
const authToken = crypto.randomBytes(32).toString('hex');
fs.writeFileSync(AUTH_TOKEN_PATH, authToken, { mode: 0o600 });
console.log(`Auth token written to ${AUTH_TOKEN_PATH}`);

// Create Express app
const app = express();
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Create session manager
const sessionManager = new SessionManager();

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token === authToken) {
    next();
  } else {
    next(new Error('Authentication failed: invalid token'));
  }
});

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    sessions: sessionManager.getActiveSessionCount(),
  });
});

// Active sessions endpoint — returns ideaIds with active sessions
app.get('/sessions/active', (_req, res) => {
  const sessions = sessionManager.getAllSessions();
  const activeIdeaIds = sessions
    .filter(s => s.status !== 'dead')
    .map(s => s.ideaId);
  res.json({ ideaIds: activeIdeaIds });
});

// Auth token endpoint (only accessible from localhost for Next.js server)
app.get('/auth-token', (req, res) => {
  // Only allow from localhost
  const remoteAddr = req.ip || req.socket.remoteAddress || '';
  const isLocalhost = remoteAddr === '127.0.0.1' || remoteAddr === '::1' || remoteAddr === '::ffff:127.0.0.1';
  if (!isLocalhost) {
    res.status(403).json({ error: 'Forbidden: only accessible from localhost' });
    return;
  }
  res.json({ token: authToken });
});

// Register socket handlers
registerSocketHandlers(io, sessionManager);

// Start server
httpServer.listen(PORT, HOST, () => {
  console.log(`PTY sidecar server listening on ${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Active sessions: ${sessionManager.getActiveSessionCount()}`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n[${new Date().toISOString()}] Received ${signal}, shutting down gracefully...`);
  console.log(`Closing Socket.io server (disconnecting ${io.engine?.clientsCount ?? 0} client(s))...`);
  io.close();
  sessionManager.shutdown();
  // Clean up auth token file
  try {
    if (fs.existsSync(AUTH_TOKEN_PATH)) {
      fs.unlinkSync(AUTH_TOKEN_PATH);
      console.log('Auth token file removed.');
    }
  } catch {
    // Ignore cleanup errors
  }
  console.log('Shutdown complete. Exiting.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
