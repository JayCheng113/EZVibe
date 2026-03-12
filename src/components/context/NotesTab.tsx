'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import type { Idea, Note } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export default function NotesTab({ idea }: { idea: Idea }) {
  const { data: notes, mutate } = useSWR<Note[]>(
    `/api/ideas/${idea.id}/notes`,
    fetcher
  );

  const [content, setContent] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  // Initialize content from fetched notes
  useEffect(() => {
    if (notes && !initialized) {
      setContent(notes.length > 0 ? notes[0].content : '');
      setInitialized(true);
    }
  }, [notes, initialized]);

  const saveNote = useCallback(async (text: string) => {
    if (savingRef.current || !text.trim()) return;
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      let res: Response;
      if (notes && notes.length > 0) {
        res = await fetch(`/api/notes/${notes[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
      } else {
        res = await fetch(`/api/ideas/${idea.id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      mutate();
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, [notes, idea.id, mutate]);

  const handleChange = (value: string) => {
    setContent(value);
    setSaveStatus('idle');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveNote(value);
    }, 2000);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveNote(content);
  };

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const text = contentRef.current;
        if (text.trim()) {
          // Fire-and-forget save
          const noteId = notes && notes.length > 0 ? notes[0].id : null;
          if (noteId) {
            fetch(`/api/notes/${noteId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: text }),
            }).catch(() => {});
          } else {
            fetch(`/api/ideas/${idea.id}/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: text }),
            }).catch(() => {});
          }
        }
      }
    };
  }, [notes, idea.id]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-3 py-1.5">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Notes</span>
        <div className="text-[10px]">
          {saveStatus === 'saving' && <span className="text-gray-500">Saving...</span>}
          {saveStatus === 'saved' && <span className="text-green-600">Saved</span>}
          {saveStatus === 'error' && <span className="text-red-500">Save failed</span>}
        </div>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <textarea
          className="h-full w-full resize-none rounded bg-gray-100 dark:bg-gray-900/50 p-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700"
          placeholder="Write notes about this idea..."
          value={content}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}
