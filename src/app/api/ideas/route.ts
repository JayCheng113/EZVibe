import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Idea } from '@/lib/types';

function rowToIdea(row: Record<string, unknown>): Idea {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    stage: row.stage as Idea['stage'],
    projectPath: (row.project_path as string) || null,
    claudeProjectKey: (row.claude_project_key as string) || null,
    color: (row.color as string) || '#6366f1',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    archived: Boolean(row.archived),
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');

    let rows: Record<string, unknown>[];
    if (stage) {
      rows = db
        .prepare('SELECT * FROM ideas WHERE stage = ? ORDER BY created_at DESC')
        .all(stage) as Record<string, unknown>[];
    } else {
      rows = db
        .prepare('SELECT * FROM ideas ORDER BY created_at DESC')
        .all() as Record<string, unknown>[];
    }

    return NextResponse.json(rows.map(rowToIdea));
  } catch (error) {
    console.error('GET /api/ideas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { name, description, projectPath } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const claudeProjectKey = projectPath
      ? projectPath.replace(/\//g, '-')
      : null;

    db.prepare(
      `INSERT INTO ideas (id, name, description, stage, project_path, claude_project_key, color, created_at, updated_at, archived)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      name.trim(),
      description || '',
      'exploring',
      projectPath || null,
      claudeProjectKey,
      '#6366f1',
      now,
      now,
      0
    );

    const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Record<string, unknown>;
    return NextResponse.json(rowToIdea(row), { status: 201 });
  } catch (error) {
    console.error('POST /api/ideas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
