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
  // Track the current ideaId to avoid stale closures
  const ideaIdRef = useRef(ideaId);
  ideaIdRef.current = ideaId;

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
      if (sid === sessionId) {
        setSessionStatus('dead');
        setSessionId(null);
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
      if (!socket || !ideaId) return;
      setError(null);
      socket.emit('session:create', { ideaId, cwd });
    },
    [socket, ideaId]
  );

  const attachSession = useCallback(
    (sid: string) => {
      if (!socket) return;
      setSessionId(sid);
      socket.emit('session:attach', { sessionId: sid });
    },
    [socket]
  );

  const detachSession = useCallback(
    (sid: string) => {
      if (!socket) return;
      socket.emit('session:detach', { sessionId: sid });
    },
    [socket]
  );

  const killSession = useCallback(
    (sid: string) => {
      if (!socket) return;
      socket.emit('session:kill', { sessionId: sid });
      setSessionId(null);
      setSessionStatus('none');
    },
    [socket]
  );

  return {
    sessionId,
    sessionStatus,
    error,
    createSession,
    attachSession,
    detachSession,
    killSession,
    setSessionId,
    setSessionStatus,
  };
}
