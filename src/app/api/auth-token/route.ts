import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const AUTH_TOKEN_PATH = path.join(os.homedir(), '.ezvibe', '.auth-token');

export async function GET() {
  try {
    const token = fs.readFileSync(AUTH_TOKEN_PATH, 'utf-8').trim();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: 'PTY server not running or auth token not found' },
      { status: 500 }
    );
  }
}
