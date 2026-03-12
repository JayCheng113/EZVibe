'use client';

import Sidebar from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-[35%] min-w-[280px] max-w-[420px]">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto bg-gray-950">
        {children}
      </main>
    </div>
  );
}
