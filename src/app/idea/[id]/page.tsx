'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import useSWR, { useSWRConfig } from 'swr';
import { useParams, useRouter } from 'next/navigation';
import type { Idea } from '@/lib/types';
import { useSocket } from '@/hooks/useSocket';
import { useSessions } from '@/hooks/useSessions';
import TerminalToolbar from '@/components/terminal/TerminalToolbar';
import ContextPanel from '@/components/context/ContextPanel';
import IdeaForm from '@/components/ideas/IdeaForm';

// TerminalView must be loaded client-only (xterm.js uses DOM APIs)
const TerminalView = dynamic(
  () => import('@/components/terminal/TerminalView'),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const { data: idea, error, isLoading, mutate } = useSWR<Idea>(
    id ? `/api/ideas/${id}` : null,
    fetcher
  );

  const { socket, isConnected, error: socketError } = useSocket();
  const [showEditForm, setShowEditForm] = useState(false);

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

  const handleDeleteIdea = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm(
      'Remove this idea from EZVibe?\n\nThis only removes it from the management system — your project files on disk will NOT be deleted.'
    );
    if (!confirmed) return;

    await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
    globalMutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/ideas'),
      undefined,
      { revalidate: true }
    );
    router.push('/ideas');
  }, [id, globalMutate, router]);

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
      {/* PTY server offline banner */}
      {!isConnected && !isLoading && (
        <div className="border-b border-yellow-300/50 bg-yellow-100/50 dark:border-yellow-800/50 dark:bg-yellow-900/30 px-4 py-2 text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          PTY 服务器离线 — 终端功能不可用。请确认 PTY sidecar 服务正在运行 (端口 3001)。
        </div>
      )}

      {/* Connection error banner */}
      {(socketError || sessionError) && (
        <div className="border-b border-red-300/50 bg-red-100/50 dark:border-red-800/50 dark:bg-red-900/30 px-4 py-2 text-xs text-red-700 dark:text-red-300">
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
        onEditIdea={() => setShowEditForm(true)}
        onDeleteIdea={handleDeleteIdea}
      />

      {/* Terminal area (~60%) */}
      <div className="flex-[6] min-h-0">
        <TerminalView
          sessionId={sessionId}
          socket={socket}
          onSessionExit={handleSessionExit}
          onRetry={handleCreateSession}
        />
      </div>

      {/* Context panel (~40%) */}
      <div className="flex-[4] min-h-0">
        <ContextPanel idea={idea} />
      </div>

      {/* Edit idea modal */}
      <IdeaForm
        idea={idea}
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSaved={() => {
          mutate();
          globalMutate(
            (key: unknown) => typeof key === 'string' && key.startsWith('/api/ideas'),
            undefined,
            { revalidate: true }
          );
        }}
      />
    </div>
  );
}
