import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Note } from '@/lib/types';

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    ideaId: row.idea_id as string,
    content: (row.content as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM notes WHERE idea_id = ? ORDER BY created_at DESC')
      .all(id) as Record<string, unknown>[];

    return NextResponse.json(rows.map(rowToNote));
  } catch (error) {
    console.error('GET /api/ideas/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;
    const db = getDb();

    // Verify idea exists
    const idea = db.prepare('SELECT id FROM ideas WHERE id = ?').get(ideaId);
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO notes (id, idea_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, ideaId, content, now, now);

    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown>;
    return NextResponse.json(rowToNote(row), { status: 201 });
  } catch (error) {
    console.error('POST /api/ideas/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
