import { Server, Socket } from 'socket.io';
import { SessionManager } from './session-manager';

export function registerSocketHandlers(io: Server, sessionManager: SessionManager): void {
  // Wire up session-level event callbacks
  sessionManager.onSessionExit = (sessionId: string, code: number) => {
    io.to(`session:${sessionId}`).emit('session:exit', { sessionId, code });
  };

  sessionManager.onSessionError = (sessionId: string, message: string) => {
    io.to(`session:${sessionId}`).emit('session:error', { sessionId, message });
  };

  sessionManager.onStatusChange = (sessionId: string, status: string) => {
    io.to(`session:${sessionId}`).emit('session:status', { sessionId, status });
  };

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // session:create — spawn new PTY
    socket.on('session:create', ({ ideaId, cwd }: { ideaId: string; cwd: string }) => {
      console.log(`session:create request — ideaId=${ideaId}, cwd=${cwd}`);
      try {
        const session = sessionManager.createSession(ideaId, cwd);

        // Join room for this session
        socket.join(`session:${session.id}`);
        sessionManager.addSocket(session.id, socket.id);

        // Pipe PTY output to this session's room
        session.pty.onData((data: string) => {
          io.to(`session:${session.id}`).emit('terminal:output', { sessionId: session.id, data });
        });

        // Notify session created
        socket.emit('session:created', {
          sessionId: session.id,
          ideaId,
          pid: session.pid,
        });
      } catch (err: any) {
        console.error('session:create failed:', err);
        socket.emit('session:error', { message: err.message });
      }
    });

    // session:find — find active session for an idea
    socket.on('session:find', ({ ideaId }: { ideaId: string }) => {
      const session = sessionManager.getSessionByIdeaId(ideaId);
      if (session) {
        socket.emit('session:found', {
          sessionId: session.id,
          ideaId: session.ideaId,
          status: session.status,
          detailedStatus: session.detailedStatus,
          pid: session.pid,
        });
      } else {
        socket.emit('session:found', { ideaId, sessionId: null });
      }
    });

    // session:attach — attach to existing session
    socket.on('session:attach', ({ sessionId }: { sessionId: string }) => {
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        socket.emit('session:error', { sessionId, message: 'Session not found' });
        return;
      }

      socket.join(`session:${sessionId}`);
      sessionManager.addSocket(sessionId, socket.id);

      // Send buffer for replay
      const buffer = sessionManager.getBuffer(sessionId);
      if (buffer) {
        socket.emit('terminal:output', { sessionId, data: buffer });
      }

      socket.emit('session:status', { sessionId, status: session.detailedStatus });
    });

    // session:detach — leave session room without killing
    socket.on('session:detach', ({ sessionId }: { sessionId: string }) => {
      socket.leave(`session:${sessionId}`);
      sessionManager.removeSocket(sessionId, socket.id);
    });

    // terminal:input — keyboard input
    socket.on('terminal:input', ({ sessionId, data }: { sessionId: string; data: string }) => {
      sessionManager.writeToSession(sessionId, data);
    });

    // terminal:resize
    socket.on('terminal:resize', ({ sessionId, cols, rows }: { sessionId: string; cols: number; rows: number }) => {
      sessionManager.resizeSession(sessionId, cols, rows);
    });

    // session:kill — PTY onExit callback will emit session:exit to the room
    socket.on('session:kill', ({ sessionId }: { sessionId: string }) => {
      sessionManager.killSession(sessionId);
    });

    // disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Remove socket from all sessions it was part of
      for (const session of sessionManager.getAllSessions()) {
        sessionManager.removeSocket(session.id, socket.id);
      }
    });
  });
}
