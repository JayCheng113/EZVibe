import { NextResponse } from 'next/server';
import { discoverProjects } from '@/lib/claude-data';

export async function GET() {
  try {
    const projects = discoverProjects();
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
