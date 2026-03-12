'use client';

import useSWR from 'swr';
import type { Idea } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useIdeas(stage?: string) {
  const url = stage ? `/api/ideas?stage=${stage}` : '/api/ideas';
  const { data, error, isLoading, mutate } = useSWR<Idea[]>(url, fetcher);

  return {
    ideas: data || [],
    isLoading,
    error,
    mutate,
  };
}

export const mutateIdeas = () => {
  // This is a convenience re-export; components should use the mutate from useIdeas
  // For external cache invalidation, use SWR's global mutate
};
