import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET ?projectPath=/Users/foo/bar — read CLAUDE.md from project root
export async function GET(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('projectPath');
  if (!projectPath) {
    return NextResponse.json({ error: 'projectPath required' }, { status: 400 });
  }

  const filePath = path.join(projectPath, 'CLAUDE.md');
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ content: '', exists: false });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ content, exists: true });
  } catch {
    return NextResponse.json({ error: 'Cannot read CLAUDE.md' }, { status: 500 });
  }
}

// PUT — write CLAUDE.md to project root
export async function PUT(request: NextRequest) {
  try {
    const { projectPath, content } = await request.json();
    if (!projectPath) {
      return NextResponse.json({ error: 'projectPath required' }, { status: 400 });
    }

    const filePath = path.join(projectPath, 'CLAUDE.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Cannot write CLAUDE.md' }, { status: 500 });
  }
}
