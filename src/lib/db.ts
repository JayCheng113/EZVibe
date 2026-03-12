import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

const DB_DIR = path.join(os.homedir(), '.ezvibe');
const DB_PATH = path.join(DB_DIR, 'ezvibe.db');

let db: Database.Database | null = null;

function initDb(): Database.Database {
  // Ensure the directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const instance = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  instance.pragma('journal_mode = WAL');

  // Create tables if they don't exist
  instance.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'exploring',
      project_path TEXT,
      claude_project_key TEXT,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      pid INTEGER,
      status TEXT DEFAULT 'starting',
      cwd TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      content TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return instance;
}

export function getDb(): Database.Database {
  if (!db) {
    db = initDb();
  }
  return db;
}
