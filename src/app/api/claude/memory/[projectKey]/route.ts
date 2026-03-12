import { NextRequest, NextResponse } from 'next/server';
import { getMemoryFiles } from '@/lib/claude-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectKey: string }> }
) {
  try {
    const { projectKey } = await params;
    const files = getMemoryFiles(projectKey);
    return NextResponse.json(files);
  } catch (error) {
    console.error('GET /api/claude/memory/[projectKey] error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
