'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import type { Idea, Note } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NotesTab({ idea }: { idea: Idea }) {
  const { data: notes, mutate } = useSWR<Note[]>(
    `/api/ideas/${idea.id}/notes`,
    fetcher
  );

  const [content, setContent] = useState('');
  const [initialized, setInitialized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  // Initialize content from fetched notes
  useEffect(() => {
    if (notes && !initialized) {
      setContent(notes.length > 0 ? notes[0].content : '');
      setInitialized(true);
    }
  }, [notes, initialized]);

  const saveNote = useCallback(async (text: string) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      if (notes && notes.length > 0) {
        // Update existing note
        await fetch(`/api/notes/${notes[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
      } else {
        // Create new note
        await fetch(`/api/ideas/${idea.id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
      }
      mutate();
    } finally {
      savingRef.current = false;
    }
  }, [notes, idea.id, mutate]);

  const handleChange = (value: string) => {
    setContent(value);
    // Debounce auto-save: 2 seconds after last keystroke
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveNote(value);
    }, 2000);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveNote(content);
  };

  return (
    <div className="flex h-full flex-col p-2">
      <textarea
        className="flex-1 resize-none rounded bg-gray-100 dark:bg-gray-900/50 p-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700"
        placeholder="Write notes about this idea..."
        value={content}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}
