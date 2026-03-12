'use client';

import useSWR from 'swr';

interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

interface UsageData {
  lastComputedDate: string;
  totalSessions: number;
  totalMessages: number;
  firstSessionDate: string;
  modelUsage: Record<string, ModelUsage>;
  dailyActivity: DailyActivity[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function UsageTab() {
  const { data, isLoading, error } = useSWR<UsageData>('/api/claude/usage', fetcher);

  if (isLoading) return <p className="p-4 text-sm text-gray-500">Loading...</p>;
  if (error || !data) return <p className="p-4 text-sm text-gray-500">No usage data available.</p>;

  const models = Object.entries(data.modelUsage);

  return (
    <div className="space-y-4 p-4">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded bg-gray-900 p-3">
          <div className="text-lg font-bold text-gray-100">{data.totalSessions}</div>
          <div className="text-[10px] text-gray-500">Total Sessions</div>
        </div>
        <div className="rounded bg-gray-900 p-3">
          <div className="text-lg font-bold text-gray-100">{data.totalMessages?.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">Total Messages</div>
        </div>
        <div className="rounded bg-gray-900 p-3">
          <div className="text-lg font-bold text-gray-100">{data.firstSessionDate?.slice(0, 10)}</div>
          <div className="text-[10px] text-gray-500">First Session</div>
        </div>
      </div>

      {/* Model usage */}
      {models.map(([model, usage]) => {
        const totalInput = usage.inputTokens + usage.cacheReadInputTokens + usage.cacheCreationInputTokens;
        const totalAll = totalInput + usage.outputTokens;
        return (
          <div key={model} className="rounded bg-gray-900 p-3">
            <div className="mb-2 text-xs font-medium text-indigo-400">{model}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Input: </span>
                <span className="text-gray-300">{formatTokens(usage.inputTokens)}</span>
              </div>
              <div>
                <span className="text-gray-500">Output: </span>
                <span className="text-gray-300">{formatTokens(usage.outputTokens)}</span>
              </div>
              <div>
                <span className="text-gray-500">Cache Read: </span>
                <span className="text-gray-300">{formatTokens(usage.cacheReadInputTokens)}</span>
              </div>
              <div>
                <span className="text-gray-500">Cache Write: </span>
                <span className="text-gray-300">{formatTokens(usage.cacheCreationInputTokens)}</span>
              </div>
            </div>
            <div className="mt-2 border-t border-gray-800 pt-2 text-xs">
              <span className="text-gray-500">Total: </span>
              <span className="font-medium text-gray-200">{formatTokens(totalAll)}</span>
            </div>
          </div>
        );
      })}

      {/* Recent daily activity */}
      {data.dailyActivity.length > 0 && (
        <div className="rounded bg-gray-900 p-3">
          <div className="mb-2 text-xs font-medium text-gray-400">Recent Activity (last 14 days)</div>
          <div className="space-y-1">
            {data.dailyActivity.slice().reverse().map((day) => (
              <div key={day.date} className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">{day.date}</span>
                <div className="flex gap-3">
                  <span className="text-gray-400">{day.messageCount} msgs</span>
                  <span className="text-gray-500">{day.sessionCount} sessions</span>
                  <span className="text-gray-600">{day.toolCallCount} tools</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-600">
        Data from ~/.claude/stats-cache.json (updated: {data.lastComputedDate})
      </p>
    </div>
  );
}
