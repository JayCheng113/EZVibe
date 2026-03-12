import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    const statsPath = path.join(os.homedir(), '.claude', 'stats-cache.json');
    if (!fs.existsSync(statsPath)) {
      return NextResponse.json({ error: 'No usage data found' }, { status: 404 });
    }

    const raw = fs.readFileSync(statsPath, 'utf-8');
    const data = JSON.parse(raw);

    return NextResponse.json({
      lastComputedDate: data.lastComputedDate,
      totalSessions: data.totalSessions,
      totalMessages: data.totalMessages,
      firstSessionDate: data.firstSessionDate,
      modelUsage: data.modelUsage || {},
      dailyActivity: (data.dailyActivity || []).slice(-14), // last 14 days
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read usage data' }, { status: 500 });
  }
}
