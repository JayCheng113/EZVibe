import fs from 'fs';
import path from 'path';
import os from 'os';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');

export function projectPathToClaudeKey(projectPath: string): string {
  return projectPath.replace(/\//g, '-');
}

export interface MemoryFile {
  name: string;
  content: string;
}

export interface PlanFile {
  filename: string;
  title: string;
  content: string;
}

export function getMemoryFiles(projectKey: string): MemoryFile[] {
  const memoryDir = path.join(CLAUDE_DIR, 'projects', projectKey, 'memory');
  if (!fs.existsSync(memoryDir)) return [];

  const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
  return files.map(f => ({
    name: f,
    content: fs.readFileSync(path.join(memoryDir, f), 'utf-8'),
  }));
}

export function getPlanFiles(): PlanFile[] {
  const plansDir = path.join(CLAUDE_DIR, 'plans');
  if (!fs.existsSync(plansDir)) return [];

  const files = fs.readdirSync(plansDir).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const content = fs.readFileSync(path.join(plansDir, f), 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return {
      filename: f,
      title: titleMatch ? titleMatch[1] : f.replace('.md', ''),
      content,
    };
  });
}

export function getPlanFile(filename: string): PlanFile | null {
  const filePath = path.join(CLAUDE_DIR, 'plans', filename);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return {
    filename,
    title: titleMatch ? titleMatch[1] : filename.replace('.md', ''),
    content,
  };
}
