'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Idea } from '@/lib/types';

interface FolderEntry {
  name: string;
  path: string;
}

interface BrowseResult {
  current: string;
  parent: string | null;
  folders: FolderEntry[];
}

interface IdeaFormProps {
  idea?: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function FolderPicker({ onSelect, onCancel, onPathChange }: { onSelect: (path: string) => void; onCancel: () => void; onPathChange?: (path: string) => void }) {
  const [browsePath, setBrowsePath] = useState('');
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const fetchDir = useCallback(async (dir?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = dir ? `?path=${encodeURIComponent(dir)}` : '';
      const res = await fetch(`/api/browse${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to browse');
      }
      const result: BrowseResult = await res.json();
      setData(result);
      setBrowsePath(result.current);
      onPathChange?.(result.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [onPathChange]);

  useEffect(() => {
    fetchDir();
  }, [fetchDir]);

  const handleNavigate = (path: string) => {
    fetchDir(path);
  };

  const handlePathSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchDir(browsePath);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !data) return;
    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPath: data.current, name: newFolderName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create folder');
      }
      const result = await res.json();
      setNewFolderName('');
      setCreatingFolder(false);
      // Navigate into the newly created folder
      fetchDir(result.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Path input with manual entry */}
      <div className="flex gap-1">
        <input
          type="text"
          value={browsePath}
          onChange={(e) => setBrowsePath(e.target.value)}
          onKeyDown={handlePathSubmit}
          className="flex-1 rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500"
          placeholder="Enter path and press Enter"
        />
        <button
          type="button"
          onClick={() => fetchDir(browsePath)}
          className="rounded bg-gray-200 dark:bg-gray-700 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Go
        </button>
      </div>

      {/* Folder list */}
      <div className="max-h-48 overflow-y-auto rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
        {loading && (
          <div className="px-3 py-4 text-center text-xs text-gray-500">Loading...</div>
        )}
        {error && (
          <div className="px-3 py-4 text-center text-xs text-red-400">{error}</div>
        )}
        {!loading && !error && data && (
          <>
            {data.parent && (
              <button
                type="button"
                onClick={() => handleNavigate(data.parent!)}
                className="flex w-full items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <span className="text-gray-500">..</span>
                <span className="text-gray-500">Parent directory</span>
              </button>
            )}
            {/* New folder inline input */}
            {creatingFolder ? (
              <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5">
                <span className="text-yellow-500">&#128193;</span>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
                  }}
                  className="flex-1 rounded border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500"
                  placeholder="Folder name"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreatingFolder(true)}
                className="flex w-full items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <span>+</span>
                <span>New Folder</span>
              </button>
            )}
            {data.folders.length === 0 && !creatingFolder && (
              <div className="px-3 py-3 text-center text-xs text-gray-500">No subdirectories</div>
            )}
            {data.folders.map((folder) => (
              <button
                key={folder.path}
                type="button"
                onClick={() => handleNavigate(folder.path)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <span className="text-yellow-500">&#128193;</span>
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <span className="truncate text-xs text-gray-500" title={data?.current}>
          {data?.current}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1 text-xs text-gray-400 hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => data && onSelect(data.current)}
            className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IdeaForm({ idea, isOpen, onClose, onSaved }: IdeaFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);

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
    setShowPicker(false);
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
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Edit Idea' : 'New Idea'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500"
              placeholder="My awesome idea"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500"
              rows={3}
              placeholder="What is this idea about?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Project Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                className="flex-1 rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500"
                placeholder="e.g. /Users/you/my-project"
              />
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="rounded border border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100"
                title="Browse folders"
              >
                &#128193;
              </button>
            </div>
            {showPicker && (
              <div className="mt-2">
                <FolderPicker
                  onSelect={(path) => {
                    setProjectPath(path);
                    setShowPicker(false);
                  }}
                  onCancel={() => setShowPicker(false)}
                  onPathChange={(path) => setProjectPath(path)}
                />
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
