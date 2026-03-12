import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    return NextResponse.json(rowToIdea(row));
  } catch (error) {
    console.error('GET /api/ideas/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ['name', 'description', 'stage', 'projectPath', 'color', 'archived'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'projectPath') {
          updates.push('project_path = ?');
          values.push(body.projectPath);
          // Also update claude_project_key
          const key = body.projectPath
            ? (body.projectPath as string).replace(/\//g, '-').replace(/^-/, '')
            : null;
          updates.push('claude_project_key = ?');
          values.push(key);
        } else if (field === 'archived') {
          updates.push('archived = ?');
          values.push(body.archived ? 1 : 0);
        } else {
          // Map camelCase to snake_case for DB columns
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE ideas SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Record<string, unknown>;
    return NextResponse.json(rowToIdea(updated));
  } catch (error) {
    console.error('PATCH /api/ideas/[id] error:', error);
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

    const existing = db.prepare('SELECT id FROM ideas WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/ideas/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
