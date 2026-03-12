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
  try {
    if (!fs.existsSync(CLAUDE_DIR)) return [];

    const memoryDir = path.join(CLAUDE_DIR, 'projects', projectKey, 'memory');
    if (!fs.existsSync(memoryDir)) return [];

    const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
    return files.map(f => {
      try {
        return {
          name: f,
          content: fs.readFileSync(path.join(memoryDir, f), 'utf-8'),
        };
      } catch (err) {
        console.error(`Failed to read memory file ${f}:`, err);
        return { name: f, content: '' };
      }
    });
  } catch (err) {
    console.error('Error reading memory files:', err);
    return [];
  }
}

export function getPlanFiles(): PlanFile[] {
  try {
    if (!fs.existsSync(CLAUDE_DIR)) return [];

    const plansDir = path.join(CLAUDE_DIR, 'plans');
    if (!fs.existsSync(plansDir)) return [];

    const files = fs.readdirSync(plansDir).filter(f => f.endsWith('.md'));
    return files.map(f => {
      try {
        const content = fs.readFileSync(path.join(plansDir, f), 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return {
          filename: f,
          title: titleMatch ? titleMatch[1] : f.replace('.md', ''),
          content,
        };
      } catch (err) {
        console.error(`Failed to read plan file ${f}:`, err);
        return {
          filename: f,
          title: f.replace('.md', ''),
          content: '',
        };
      }
    });
  } catch (err) {
    console.error('Error reading plan files:', err);
    return [];
  }
}

export function getPlanFile(filename: string): PlanFile | null {
  try {
    if (!fs.existsSync(CLAUDE_DIR)) return null;

    const filePath = path.join(CLAUDE_DIR, 'plans', filename);
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return {
      filename,
      title: titleMatch ? titleMatch[1] : filename.replace('.md', ''),
      content,
    };
  } catch (err) {
    console.error(`Error reading plan file ${filename}:`, err);
    return null;
  }
}
