import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dir = searchParams.get('path') || os.homedir();

  try {
    // Resolve to absolute and normalize
    const resolvedDir = path.resolve(dir);

    if (!fs.existsSync(resolvedDir)) {
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
    }

    const stat = fs.statSync(resolvedDir);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
    }

    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
    const folders = entries
      .filter((e) => {
        // Only directories, skip hidden files (except common ones)
        if (!e.isDirectory()) return false;
        if (e.name.startsWith('.') && e.name !== '.git') return false;
        // Skip system/unreadable directories
        if (['node_modules', '__pycache__', '.Trash'].includes(e.name)) return false;
        return true;
      })
      .map((e) => ({
        name: e.name,
        path: path.join(resolvedDir, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      current: resolvedDir,
      parent: path.dirname(resolvedDir) !== resolvedDir ? path.dirname(resolvedDir) : null,
      folders,
    });
  } catch {
    return NextResponse.json({ error: 'Cannot read directory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { parentPath, name } = await request.json();

    if (!parentPath || !name) {
      return NextResponse.json({ error: 'parentPath and name are required' }, { status: 400 });
    }

    // Prevent path traversal
    if (name.includes('/') || name.includes('\\') || name === '..' || name === '.') {
      return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 });
    }

    const resolvedParent = path.resolve(parentPath);
    if (!fs.existsSync(resolvedParent) || !fs.statSync(resolvedParent).isDirectory()) {
      return NextResponse.json({ error: 'Parent directory not found' }, { status: 404 });
    }

    const newDir = path.join(resolvedParent, name);
    if (fs.existsSync(newDir)) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 409 });
    }

    fs.mkdirSync(newDir, { recursive: true });
    return NextResponse.json({ path: newDir });
  } catch {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
