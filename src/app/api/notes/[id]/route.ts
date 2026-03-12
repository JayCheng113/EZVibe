import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE notes SET content = ?, updated_at = ? WHERE id = ?').run(content, now, id);

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown>;
    return NextResponse.json(rowToNote(updated));
  } catch (error) {
    console.error('PATCH /api/notes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM notes WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
