'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import type { Idea } from '@/lib/types';
import { useSocket } from '@/hooks/useSocket';
import { useSessions } from '@/hooks/useSessions';
import TerminalToolbar from '@/components/terminal/TerminalToolbar';

// TerminalView must be loaded client-only (xterm.js uses DOM APIs)
const TerminalView = dynamic(
  () => import('@/components/terminal/TerminalView'),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: idea, error, isLoading } = useSWR<Idea>(
    id ? `/api/ideas/${id}` : null,
    fetcher
  );

  const { socket, isConnected, error: socketError } = useSocket();

  const {
    sessionId,
    sessionStatus,
    error: sessionError,
    createSession,
    killSession,
  } = useSessions({ socket, ideaId: id || null });

  const handleCreateSession = useCallback(() => {
    if (!idea?.projectPath) return;
    createSession(idea.projectPath);
  }, [idea?.projectPath, createSession]);

  const handleKillSession = useCallback(() => {
    if (!sessionId) return;
    killSession(sessionId);
  }, [sessionId, killSession]);

  const handleSessionExit = useCallback(() => {
    // Session ended - UI will update via sessionStatus
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400">Idea not found.</p>
          <Link href="/ideas" className="mt-3 inline-block text-sm text-indigo-400 hover:underline">
            &larr; Back to ideas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Connection error banner */}
      {(socketError || sessionError) && (
        <div className="border-b border-red-800/50 bg-red-900/30 px-4 py-2 text-xs text-red-300">
          {socketError || sessionError}
        </div>
      )}

      {/* Terminal toolbar */}
      <TerminalToolbar
        idea={idea}
        sessionId={sessionId}
        sessionStatus={sessionStatus}
        onCreateSession={handleCreateSession}
        onKillSession={handleKillSession}
      />

      {/* Terminal area */}
      <div className="flex-1 min-h-0">
        <TerminalView
          sessionId={sessionId}
          socket={socket}
          onSessionExit={handleSessionExit}
        />
      </div>
    </div>
  );
}
