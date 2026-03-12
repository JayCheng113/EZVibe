import { NextResponse } from 'next/server';
import { getPlanFiles } from '@/lib/claude-data';

export async function GET() {
  try {
    const plans = getPlanFiles();
    return NextResponse.json(plans);
  } catch (error) {
    console.error('GET /api/claude/plans error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
