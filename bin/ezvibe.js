#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const port = args.find((_, i, a) => a[i - 1] === '--port') || '3000';
const ptyPort = args.find((_, i, a) => a[i - 1] === '--pty-port') || '3001';

// Colors
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(`
${cyan('  ╔═══════════════════════════╗')}
${cyan('  ║')}     ${green('EZVibe')} v${require('../package.json').version}     ${cyan('║')}
${cyan('  ║')}  Claude Code Orchestrator  ${cyan('║')}
${cyan('  ╚═══════════════════════════╝')}
`);

// Check if Claude Code is installed
function checkClaude() {
  const homedir = require('os').homedir();
  const candidates = [
    path.join(homedir, '.npm-global', 'bin', 'claude'),
    path.join(homedir, '.local', 'bin', 'claude'),
    '/usr/local/bin/claude',
  ];

  // Check PATH first
  try {
    execSync('which claude', { stdio: 'ignore' });
    return true;
  } catch {}

  // Check common locations
  for (const p of candidates) {
    if (fs.existsSync(p)) return true;
  }

  return false;
}

if (!checkClaude()) {
  console.log(`  ${cyan('Claude Code not found.')}`);
  console.log(`  Installing Claude Code via npm...\n`);
  try {
    execSync('npm install -g @anthropic-ai/claude-code', { cwd: ROOT, stdio: 'inherit' });
    console.log(green('\n  Claude Code installed successfully.\n'));
  } catch {
    console.error('\n  Failed to install Claude Code automatically.');
    console.error('  Please install it manually: npm install -g @anthropic-ai/claude-code\n');
    process.exit(1);
  }
} else {
  console.log(`  ${green('✓')} Claude Code detected\n`);
}

// Check if Next.js is built (BUILD_ID only exists after successful build)
const buildId = path.join(ROOT, '.next', 'BUILD_ID');
if (!fs.existsSync(buildId)) {
  console.log(dim('  Building Next.js (first run only)...'));
  try {
    execSync(`"${path.join(ROOT, 'node_modules', '.bin', 'next')}" build`, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('\n  Build failed. Please check errors above.');
    process.exit(1);
  }
  console.log(green('  Build complete.\n'));
}

// Start PTY sidecar
const pty = spawn(
  process.execPath,
  [require.resolve('tsx/cli'), path.join(ROOT, 'server/index.ts')],
  {
    cwd: ROOT,
    env: { ...process.env, PORT: ptyPort },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

// Start Next.js production server
const next = spawn(
  'npx',
  ['next', 'start', '-p', port],
  {
    cwd: ROOT,
    env: { ...process.env, NEXT_PUBLIC_PTY_PORT: ptyPort },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

let ready = 0;
const checkReady = () => {
  ready++;
  if (ready === 2) {
    console.log(green('  Ready!'));
    console.log(`  ${cyan('→')} Open ${green(`http://localhost:${port}`)} in your browser\n`);
  }
};

pty.stdout.on('data', (data) => {
  const line = data.toString();
  if (line.includes('listening on')) {
    console.log(`  ${dim('PTY sidecar')}  → port ${ptyPort}`);
    checkReady();
  }
});

next.stdout.on('data', (data) => {
  const line = data.toString();
  if (line.includes('Ready') || line.includes('started')) {
    console.log(`  ${dim('Next.js')}      → port ${port}`);
    checkReady();
  }
});

pty.stderr.on('data', (d) => process.stderr.write(d));
next.stderr.on('data', (d) => process.stderr.write(d));

// Graceful shutdown
const cleanup = () => {
  console.log(dim('\n  Shutting down...'));
  pty.kill('SIGTERM');
  next.kill('SIGTERM');
  setTimeout(() => process.exit(0), 2000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

pty.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`  PTY sidecar exited with code ${code}`);
  }
});

next.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`  Next.js exited with code ${code}`);
  }
});
