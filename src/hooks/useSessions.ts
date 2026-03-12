'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';

interface UseSessionsOptions {
  socket: Socket | null;
  ideaId: string | null;
}

export function useSessions({ socket, ideaId }: UseSessionsOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);
  // Track current values to avoid stale closures
  const ideaIdRef = useRef(ideaId);
  ideaIdRef.current = ideaId;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  // On mount: find any existing active session for this idea
  useEffect(() => {
    if (!socket || !ideaId) return;

    const onFound = ({ sessionId: sid, status, detailedStatus }: { ideaId: string; sessionId: string | null; status?: string; detailedStatus?: string; pid?: number }) => {
      if (sid) {
        console.log('[useSessions] found existing session', sid, status, detailedStatus);
        setSessionId(sid);
        setSessionStatus(detailedStatus || status || 'active');
        setError(null);
        // Attach to get buffer replay and output
        socket.emit('session:attach', { sessionId: sid });
      }
    };

    socket.once('session:found', onFound);
    socket.emit('session:find', { ideaId });

    return () => {
      socket.off('session:found', onFound);
    };
  }, [socket, ideaId]);

  // Listen to session events
  useEffect(() => {
    if (!socket) return;

    const onSessionCreated = ({ sessionId: sid, ideaId: iid }: { sessionId: string; ideaId: string; pid: number }) => {
      // Only accept if it matches our current idea
      if (iid === ideaIdRef.current) {
        setSessionId(sid);
        setSessionStatus('starting');
        setError(null);
      }
    };

    const onSessionStatus = ({ sessionId: sid, status }: { sessionId: string; status: string }) => {
      if (sid === sessionId || sessionId === null) {
        setSessionStatus(status);
      }
    };

    const onSessionExit = ({ sessionId: sid }: { sessionId: string; code: number }) => {
      if (sid === sessionIdRef.current) {
        setSessionStatus('dead');
        // Keep sessionId so TerminalView continues to show "[Session ended]"
        // It will be cleared when user starts a new session or navigates away
      }
    };

    const onSessionError = ({ message }: { sessionId?: string; message: string }) => {
      setError(message);
    };

    socket.on('session:created', onSessionCreated);
    socket.on('session:status', onSessionStatus);
    socket.on('session:exit', onSessionExit);
    socket.on('session:error', onSessionError);

    return () => {
      socket.off('session:created', onSessionCreated);
      socket.off('session:status', onSessionStatus);
      socket.off('session:exit', onSessionExit);
      socket.off('session:error', onSessionError);
    };
  }, [socket, sessionId]);

  const createSession = useCallback(
    (cwd: string) => {
      if (!socket || !ideaId) {
        setError(!socket ? 'PTY server not connected' : 'No idea selected');
        return;
      }
      if (!socket.connected) {
        setError('PTY server not connected — try refreshing the page');
        return;
      }
      setError(null);
      console.log('[useSessions] emitting session:create', { ideaId, cwd });
      socket.emit('session:create', { ideaId, cwd });
    },
    [socket, ideaId]
  );

  const killSession = useCallback(
    (sid: string) => {
      if (!socket) return;
      socket.emit('session:kill', { sessionId: sid });
      // Don't clear sessionId here — let the server's session:exit event update state
      // so TerminalView can show "[Session ended]" before clearing
    },
    [socket]
  );

  return {
    sessionId,
    sessionStatus,
    error,
    createSession,
    killSession,
  };
}
