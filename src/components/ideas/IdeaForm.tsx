'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Idea } from '@/lib/types';
import { STAGES, STAGE_LABELS, STAGE_ICONS } from '@/lib/constants';
import type { Stage } from '@/lib/constants';

interface FolderEntry {
  name: string;
  path: string;
}

interface BrowseResult {
  current: string;
  parent: string | null;
  folders: FolderEntry[];
}

interface DiscoveredProject {
  path: string;
  name: string;
  hasClaudeMd: boolean;
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
  const [stage, setStage] = useState<Stage>('exploring');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [discoveredProjects, setDiscoveredProjects] = useState<DiscoveredProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const isEditing = Boolean(idea);

  useEffect(() => {
    if (idea) {
      setName(idea.name);
      setDescription(idea.description || '');
      setProjectPath(idea.projectPath || '');
      setStage(idea.stage);
    } else {
      setName('');
      setDescription('');
      setProjectPath('');
      setStage('exploring');
    }
    setError('');
    setShowPicker(false);
  }, [idea, isOpen]);

  // Fetch discovered projects when creating a new idea
  useEffect(() => {
    if (!isOpen || isEditing) return;
    setLoadingProjects(true);
    fetch('/api/discover-projects')
      .then((res) => res.json())
      .then((data: DiscoveredProject[]) => setDiscoveredProjects(data))
      .catch(() => setDiscoveredProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [isOpen, isEditing]);

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
      if (isEditing) body.stage = stage;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {isEditing ? 'Edit Idea' : 'New Idea'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="My awesome idea"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              rows={3}
              placeholder="What is this idea about?"
            />
          </div>
          {isEditing && (
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((s) => {
                  const isActive = stage === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStage(s)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150"
                      style={{
                        background: isActive ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-default)'}`,
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      <span>{STAGE_ICONS[s]}</span>
                      {STAGE_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Project Path</label>
            {/* Discovered projects from Claude Code */}
            {!isEditing && discoveredProjects.length > 0 && (
              <div className="mb-2">
                <p className="mb-1.5 text-xs text-gray-500">Discovered from Claude Code</p>
                <div className="flex flex-wrap gap-1.5">
                  {discoveredProjects.map((proj) => (
                    <button
                      key={proj.path}
                      type="button"
                      onClick={() => {
                        setProjectPath(proj.path);
                        setShowPicker(false);
                      }}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        projectPath === proj.path
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800'
                      }`}
                      title={proj.path}
                    >
                      {proj.name}
                      {proj.hasClaudeMd && (
                        <span className="ml-1 text-green-400" title="Has CLAUDE.md">*</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!isEditing && loadingProjects && (
              <p className="mb-2 text-xs text-gray-500">Discovering projects...</p>
            )}
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
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
