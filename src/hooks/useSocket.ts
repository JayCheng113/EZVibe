'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const PTY_SERVER_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);

  const connect = useCallback(async () => {
    // Prevent concurrent connect attempts
    if (connectingRef.current) return;
    connectingRef.current = true;

    try {
      // Disconnect old socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }

      // Fetch auth token from our Next.js API route
      const res = await fetch('/api/auth-token');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Failed to fetch auth token');
        return;
      }

      const { token } = await res.json();

      const newSocket = io(PTY_SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      newSocket.on('connect', () => {
        console.log('[useSocket] connected');
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[useSocket] disconnected:', reason);
        setIsConnected(false);
        // If the server shut down or token changed, reconnect with fresh token
        if (reason === 'io server disconnect' || reason === 'transport close') {
          setTimeout(() => {
            connectingRef.current = false;
            connect();
          }, 2000);
        }
      });

      newSocket.on('connect_error', (err) => {
        console.log('[useSocket] connect_error:', err.message);
        // Auth failure means token changed (server restarted) — reconnect with fresh token
        if (err.message.includes('Authentication failed')) {
          newSocket.disconnect();
          setTimeout(() => {
            connectingRef.current = false;
            connect();
          }, 2000);
          return;
        }
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to PTY server');
    } finally {
      connectingRef.current = false;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [connect]);

  return {
    socket,
    isConnected,
    error,
  };
}
