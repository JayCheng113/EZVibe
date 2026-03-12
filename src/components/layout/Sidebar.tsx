'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import IdeaList from '../ideas/IdeaList';
import IdeaForm from '../ideas/IdeaForm';

export default function Sidebar() {
  const [showForm, setShowForm] = useState(false);
  const { mutate } = useSWRConfig();

  const handleSaved = () => {
    // Invalidate all ideas queries by matching the key prefix
    mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/ideas'),
      undefined,
      { revalidate: true }
    );
  };

  return (
    <aside className="flex h-full flex-col bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-100">
          <span className="mr-1">&#9889;</span>EZVibe
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <IdeaList />
      </div>
      <IdeaForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSaved={handleSaved}
      />
    </aside>
  );
}
