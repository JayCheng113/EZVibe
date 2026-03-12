'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Idea } from '@/lib/types';

export default function ClaudemdTab({ idea }: { idea: Idea }) {
  const [content, setContent] = useState('');
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectPath = idea.projectPath;
  const contentRef = useRef(content);
  const dirtyRef = useRef(dirty);
  contentRef.current = content;
  dirtyRef.current = dirty;

  // Fetch CLAUDE.md content
  useEffect(() => {
    if (!projectPath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/claude/claudemd?projectPath=${encodeURIComponent(projectPath)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setContent(data.content || '');
        setExists(data.exists || false);
        setDirty(false);
      })
      .catch(() => setContent(''))
      .finally(() => setLoading(false));
  }, [projectPath]);

  // Auto-save with debounce
  const save = useCallback(async (text: string) => {
    if (!projectPath) return;
    setSaving(true);
    try {
      const res = await fetch('/api/claude/claudemd', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, content: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setExists(true);
      setDirty(false);
    } catch {
      // Keep dirty=true so user knows save failed
    } finally {
      setSaving(false);
    }
  }, [projectPath]);

  const handleChange = (text: string) => {
    setContent(text);
    setDirty(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 2000);
  };

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dirtyRef.current && projectPath) {
        // Fire-and-forget save
        fetch('/api/claude/claudemd', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath, content: contentRef.current }),
        }).catch(() => {});
      }
    };
  }, [projectPath]);

  if (!projectPath) {
    return <p className="p-4 text-sm text-gray-500">Set a project path to view CLAUDE.md</p>;
  }

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">CLAUDE.md</span>
          {!exists && !dirty && (
            <span className="text-[10px] text-gray-600 dark:text-gray-500">does not exist yet — start typing to create</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-gray-500">Saving...</span>}
          {dirty && !saving && <span className="text-[10px] text-yellow-500">Unsaved</span>}
          {!dirty && exists && <span className="text-[10px] text-green-600">Saved</span>}
          <button
            onClick={() => save(content)}
            disabled={!dirty || saving}
            className="rounded bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-[10px] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30"
          >
            Save
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 resize-none bg-white dark:bg-gray-950 px-4 py-3 font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-300 outline-none placeholder-gray-400 dark:placeholder-gray-600"
        placeholder="# Project Instructions&#10;&#10;Write instructions for Claude Code here...&#10;This file will be read by Claude Code when working on this project."
        spellCheck={false}
      />
    </div>
  );
}
