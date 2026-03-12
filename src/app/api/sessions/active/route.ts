import { NextResponse } from 'next/server';

const PTY_SERVER = 'http://127.0.0.1:3001';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${PTY_SERVER}/sessions/active`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ ideaIds: [] });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // PTY server not running
    return NextResponse.json({ ideaIds: [] });
  }
}
