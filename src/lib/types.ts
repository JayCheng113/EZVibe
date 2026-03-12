export interface Idea {
  id: string;
  name: string;
  description: string;
  stage: 'exploring' | 'planning' | 'implementing' | 'done';
  projectPath: string | null;
  claudeProjectKey: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface Session {
  id: string;
  ideaId: string;
  pid: number | null;
  status: 'starting' | 'active' | 'dead';
  cwd: string;
  startedAt: string;
  endedAt: string | null;
}

export interface Note {
  id: string;
  ideaId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// WebSocket event payloads

export interface TerminalInput {
  data: string;
}

export interface TerminalResize {
  cols: number;
  rows: number;
}

export interface SessionCreate {
  ideaId: string;
  cwd: string;
}

export interface SessionKill {
  sessionId: string;
}

export interface TerminalOutput {
  data: string;
}

export interface SessionStatus {
  sessionId: string;
  status: Session['status'];
}

export interface SessionExit {
  sessionId: string;
  code: number;
}

export interface SessionError {
  sessionId: string;
  message: string;
}
