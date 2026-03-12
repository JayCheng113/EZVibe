import { NextRequest, NextResponse } from 'next/server';
import { getPlanFile } from '@/lib/claude-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const plan = getPlanFile(filename);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error('GET /api/claude/plans/[filename] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
