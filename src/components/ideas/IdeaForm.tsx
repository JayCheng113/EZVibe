'use client';

import { useState, useEffect } from 'react';
import type { Idea } from '@/lib/types';

interface IdeaFormProps {
  idea?: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function IdeaForm({ idea, isOpen, onClose, onSaved }: IdeaFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(idea);

  useEffect(() => {
    if (idea) {
      setName(idea.name);
      setDescription(idea.description || '');
      setProjectPath(idea.projectPath || '');
    } else {
      setName('');
      setDescription('');
      setProjectPath('');
    }
    setError('');
  }, [idea, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const body: Record<string, string> = { name: name.trim() };
      if (description.trim()) body.description = description.trim();
      if (projectPath.trim()) body.projectPath = projectPath.trim();

      const url = isEditing ? `/api/ideas/${idea!.id}` : '/api/ideas';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-100">
          {isEditing ? 'Edit Idea' : 'New Idea'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500"
              placeholder="My awesome idea"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500"
              rows={3}
              placeholder="What is this idea about?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Project Path</label>
            <input
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500"
              placeholder="e.g. /Users/you/my-project"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
