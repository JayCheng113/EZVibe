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

export interface DiscoveredProject {
  path: string;
  name: string;
  hasClaudeMd: boolean;
}

/**
 * Convert a Claude projects directory name back to a filesystem path.
 * The directory name uses `-` as separator: `-Users-zcheng256-PixUI` → `/Users/zcheng256/PixUI`.
 * Since folder names may contain dashes, we try progressively longer path segments
 * and verify with fs.existsSync.
 */
function claudeKeyToProjectPath(key: string): string | null {
  // The key starts with a leading `-` which represents `/`
  // Then each `-` could be a path separator or part of a folder name
  const parts = key.split('-').filter(Boolean); // remove empty strings from leading `-`

  // Try to reconstruct the path by testing which `-` are separators vs literal dashes
  // Use a greedy approach: try the simple conversion first (all dashes are separators)
  const simplePath = '/' + parts.join('/');
  if (fs.existsSync(simplePath)) {
    return simplePath;
  }

  // Try merging adjacent parts with dashes to handle folder names containing dashes
  // Use recursive backtracking with a depth limit
  function tryBuild(idx: number, segments: string[]): string | null {
    if (idx >= parts.length) {
      const candidate = '/' + segments.join('/');
      return fs.existsSync(candidate) ? candidate : null;
    }

    // Option 1: current part is a new path segment
    const asNew = tryBuild(idx + 1, [...segments, parts[idx]]);
    if (asNew) return asNew;

    // Option 2: merge current part into the last segment with a dash
    if (segments.length > 0) {
      const merged = [...segments];
      merged[merged.length - 1] += '-' + parts[idx];
      const asMerged = tryBuild(idx + 1, merged);
      if (asMerged) return asMerged;
    }

    return null;
  }

  return tryBuild(0, []);
}

export function discoverProjects(): DiscoveredProject[] {
  try {
    const projectsDir = path.join(CLAUDE_DIR, 'projects');
    if (!fs.existsSync(projectsDir)) return [];

    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    const results: Array<DiscoveredProject & { mtime: number }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirName = entry.name;
      const projectPath = claudeKeyToProjectPath(dirName);
      if (!projectPath) continue;

      const hasClaudeMd = fs.existsSync(
        path.join(projectsDir, dirName, 'CLAUDE.md')
      );

      let mtime = 0;
      try {
        const stat = fs.statSync(path.join(projectsDir, dirName));
        mtime = stat.mtimeMs;
      } catch {
        // ignore
      }

      results.push({
        path: projectPath,
        name: path.basename(projectPath),
        hasClaudeMd,
        mtime,
      });
    }

    // Sort by most recently modified first
    results.sort((a, b) => b.mtime - a.mtime);

    return results.map(({ mtime: _, ...rest }) => rest);
  } catch (err) {
    console.error('Error discovering projects:', err);
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
