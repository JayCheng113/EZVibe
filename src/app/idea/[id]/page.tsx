'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import type { Idea } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: idea, error, isLoading } = useSWR<Idea>(
    id ? `/api/ideas/${id}` : null,
    fetcher
  );

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
    <div className="flex h-full flex-col p-6">
      <Link href="/ideas" className="mb-4 text-sm text-indigo-400 hover:underline">
        &larr; Back to ideas
      </Link>
      <h1 className="text-2xl font-bold text-gray-100">{idea.name}</h1>
      {idea.description && (
        <p className="mt-2 text-sm text-gray-400">{idea.description}</p>
      )}
      <div className="mt-8 flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-700">
        <p className="text-sm text-gray-500">Terminal and context panel coming soon</p>
      </div>
    </div>
  );
}
