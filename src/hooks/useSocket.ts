'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const PTY_SERVER_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    // Don't reconnect if already connected
    if (socketRef.current?.connected) return;

    try {
      // Fetch auth token from our Next.js API route
      const res = await fetch('/api/auth-token');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Failed to fetch auth token');
        return;
      }

      const { token } = await res.json();

      const socket = io(PTY_SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });

      socketRef.current = socket;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to PTY server');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [connect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
  };
}
