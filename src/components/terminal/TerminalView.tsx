'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
  sessionId: string | null;
  socket: Socket | null;
  onSessionExit?: () => void;
  onRetry?: () => void;
}

export default function TerminalView({ sessionId, socket, onSessionExit, onRetry }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const currentSessionRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(socket);
  socketRef.current = socket;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize xterm.js (once)
  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let terminal: any = null;
    let fitAddon: any = null;

    (async () => {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');

      if (disposed) return;

      terminal = new Terminal({
        theme: {
          background: '#0a0a1a',
          foreground: '#e0e0e0',
          cursor: '#e0e0e0',
          selectionBackground: '#3a3a5a',
          black: '#0a0a1a',
          red: '#e94560',
          green: '#4caf50',
          yellow: '#ffb74d',
          blue: '#42a5f5',
          magenta: '#b39ddb',
          cyan: '#00d4ff',
          white: '#e0e0e0',
          brightBlack: '#666666',
          brightRed: '#ff6b6b',
          brightGreen: '#69f0ae',
          brightYellow: '#ffd54f',
          brightBlue: '#64b5f6',
          brightMagenta: '#ce93d8',
          brightCyan: '#4dd0e1',
          brightWhite: '#ffffff',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 13,
        lineHeight: 1.2,
        cursorBlink: true,
        allowProposedApi: true,
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      // Try WebGL addon, fallback to canvas
      try {
        const { WebglAddon } = await import('@xterm/addon-webgl');
        if (!disposed) {
          const webglAddon = new WebglAddon();
          webglAddon.onContextLoss(() => {
            webglAddon.dispose();
          });
          terminal.loadAddon(webglAddon);
        }
      } catch {
        // WebGL not available, xterm uses canvas by default
      }

      if (disposed || !containerRef.current) return;

      terminal.open(containerRef.current);

      // Small delay to ensure container is measured
      requestAnimationFrame(() => {
        if (!disposed && fitAddon) {
          try {
            fitAddon.fit();
          } catch {
            // Container may not be visible yet
          }
        }
      });

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // ResizeObserver for container resizing
      const observer = new ResizeObserver(() => {
        if (fitAddonRef.current && terminalRef.current) {
          try {
            fitAddonRef.current.fit();
            const sid = currentSessionRef.current;
            if (sid && socketRef.current) {
              socketRef.current.emit('terminal:resize', {
                sessionId: sid,
                cols: terminalRef.current.cols,
                rows: terminalRef.current.rows,
              });
            }
          } catch {
            // Ignore resize errors
          }
        }
      });
      observer.observe(containerRef.current);
      resizeObserverRef.current = observer;
    })();

    return () => {
      disposed = true;
      resizeObserverRef.current?.disconnect();
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Handle session attachment and data flow
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!socket || !terminal) return;

    const prevSessionId = currentSessionRef.current;

    // Detach from previous session
    if (prevSessionId && prevSessionId !== sessionId) {
      socket.emit('session:detach', { sessionId: prevSessionId });
    }

    currentSessionRef.current = sessionId;

    if (!sessionId) {
      terminal.clear();
      terminal.write('\r\n  Press "Start Claude Code" to begin a session.\r\n');
      return;
    }

    // Clear terminal and attach to new session
    terminal.clear();
    terminal.reset();
    socket.emit('session:attach', { sessionId });

    // Listen for output
    const onOutput = ({ sessionId: sid, data }: { sessionId: string; data: string }) => {
      if (sid === sessionId) {
        terminal.write(data);
      }
    };

    const onExit = ({ sessionId: sid }: { sessionId: string; code: number }) => {
      if (sid === sessionId) {
        terminal.write('\r\n\x1b[90m[Session ended]\x1b[0m\r\n');
        currentSessionRef.current = null;
        onSessionExit?.();
      }
    };

    const onError = ({ sessionId: sid, message }: { sessionId?: string; message: string }) => {
      if (!sid || sid === sessionId) {
        const errorText = message || 'Failed to start Claude Code — check if claude is installed and in PATH';
        terminal.write(`\r\n\x1b[31m[Error] ${errorText}\x1b[0m\r\n`);
        setErrorMessage(errorText);
      }
    };

    // Clear any previous error when starting a new session
    setErrorMessage(null);

    socket.on('terminal:output', onOutput);
    socket.on('session:exit', onExit);
    socket.on('session:error', onError);

    // Send user input to server
    const onDataDisposable = terminal.onData((data: string) => {
      if (currentSessionRef.current) {
        socket.emit('terminal:input', { sessionId: currentSessionRef.current, data });
      }
    });

    // Fit and notify server of size
    if (fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
        socket.emit('terminal:resize', {
          sessionId,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      } catch {
        // Ignore
      }
    }

    return () => {
      socket.off('terminal:output', onOutput);
      socket.off('session:exit', onExit);
      socket.off('session:error', onError);
      onDataDisposable.dispose();
    };
  }, [sessionId, socket, onSessionExit]);

  // Handle socket reconnection: re-attach to session
  useEffect(() => {
    if (!socket) return;

    const onReconnect = () => {
      const sid = currentSessionRef.current;
      if (sid) {
        socket.emit('session:attach', { sessionId: sid });
      }
    };

    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.io.off('reconnect', onReconnect);
    };
  }, [socket]);

  return (
    <div className="relative h-full w-full min-h-[200px]">
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ backgroundColor: '#0a0a1a' }}
      />
      {errorMessage && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded border border-red-700/60 bg-red-950/90 px-4 py-3 text-sm text-red-300 shadow-lg">
          <span className="flex-1">{errorMessage}</span>
          {onRetry && (
            <button
              onClick={() => {
                setErrorMessage(null);
                onRetry();
              }}
              className="shrink-0 rounded bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
