<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Orchestrator-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgNyAxMiAxMiAyMiA3eiIvPjxwYXRoIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIuNyIgZD0iTTIgMTdsMTAgNSAxMC01TTIgMTJsMTAgNSAxMC01Ii8+PC9zdmc+"/>
  <br/>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img src="https://img.shields.io/badge/Next.js-15-black" />
  <img src="https://img.shields.io/badge/node--pty-realtime-green" />
  <img src="https://img.shields.io/badge/xterm.js-WebGL-orange" />
</p>

# EZVibe

> **Stop juggling terminals. Start shipping ideas.**

EZVibe is a local web dashboard that lets you run multiple Claude Code sessions side by side, with full idea lifecycle tracking — from brainstorm to production. One command to start, zero config.

```bash
npx ezvibe
```

---

## Why EZVibe?

You're running 3 Claude Code sessions across different projects. Terminal A is implementing auth, Terminal B is debugging an API, Terminal C is writing tests. You keep losing track: *which terminal was which? What was I doing in that project? Where did Claude's plan go?*

**EZVibe fixes this.** Each project gets its own idea card, its own terminal, and its own context panel — all visible at a glance.

```
┌─────────────────────┬──────────────────────────────────┐
│  IDEAS               │  Terminal (xterm.js)              │
│                      │  $ claude                         │
│  ● Auth System  ⚡   │  > Implementing JWT middleware... │
│  ○ Trading Bot  📋   │                                   │
│  ○ Blog CMS     💬   │──────────────────────────────────│
│                      │  [Instructions] [Memory] [Notes]  │
│  + New Idea          │  # Implementation Plan             │
│                      │  ## Step 1: Setup routes...        │
└─────────────────────┴──────────────────────────────────┘
```

### What makes it different?

| | Claude Code (terminal) | Claude Squad / CCManager | **EZVibe** |
|---|---|---|---|
| Interface | Single terminal | TUI multiplexer | **Web dashboard** |
| Perspective | One session at a time | Session management | **Idea lifecycle tracking** |
| Context | Scattered across files | None | **Plans + Memory + Notes panel** |
| `~/.claude/` data | N/A | Not read | **Deep integration** |

---

## Quick Start

### Prerequisites

- **Node.js 18+**
- **Claude Code** installed and in PATH — [Install Claude Code](https://claude.ai/code)
- **macOS or Linux** (node-pty requires a POSIX system)

### One command. That's it.

```bash
npx ezvibe
```

First run builds automatically (~30s), then opens at **http://localhost:3000**.

```bash
# Custom ports
npx ezvibe --port 8080 --pty-port 4000
```

---

## How It Works

### 1. Create an Idea

Click **"+ New"** → Name your project → Set the project directory path.

> **Tip:** Setting a project path unlocks the full power — EZVibe reads that project's `CLAUDE.md`, memory files, and plans from `~/.claude/` automatically.

### 2. Launch Claude Code

Click **"Start Claude Code"** — a real terminal spawns in your browser. Full color, full keyboard, full scrollback. It's the same Claude Code you know, just embedded.

### 3. Track Progress

Move ideas through stages as you work:

```
💬 Exploring  →  📋 Planning  →  ⚡ Implementing  →  ✅ Done
```

### 4. Use the Context Panel

Four tabs sit below your terminal, giving you everything without switching windows:

| Tab | What you get |
|---|---|
| **Instructions** | Edit `CLAUDE.md` live — Claude reads it on next message |
| **Memory** | Browse Claude's project memory files |
| **Notes** | Your freeform scratchpad (auto-saves) |
| **Token** | Usage stats, model breakdown, daily activity |

### 5. Switch Freely

Click any idea in the sidebar — the terminal switches instantly with buffer preserved. Background sessions keep running. Come back anytime, right where you left off.

---

## Architecture

EZVibe uses the same **dual-process pattern as VS Code** — a UI process and a terminal sidecar:

```
Browser (:3000)
  ├── React UI + REST APIs (Next.js 15)
  │   └── SQLite for ideas, notes, sessions
  └── WebSocket ──→ PTY Sidecar (:3001)
                     ├── node-pty terminals (real OS PTYs)
                     ├── ~100KB rolling buffer per session
                     └── Socket.io rooms for multi-session routing
```

**Why two processes?** `node-pty` is a C++ native addon. Next.js webpack breaks native addons. Separating them means each does what it's best at.

### Security

All local, nothing leaves your machine:
- PTY server binds to `127.0.0.1` only
- Auth token required for WebSocket handshake
- CORS locked to `localhost:3000`

---

## Development

```bash
git clone https://github.com/JayCheng113/EZVibe.git
cd EZVibe
npm install
npm run dev
```

Starts Next.js (:3000) and PTY sidecar (:3001) concurrently with hot reload.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Terminal | xterm.js 5 + WebGL renderer + FitAddon |
| Realtime | Socket.io (WebSocket + auto-reconnect) |
| PTY | node-pty (same as VS Code's terminal) |
| Database | better-sqlite3 (WAL mode, zero-config) |
| Data Fetching | SWR (auto-revalidation) |

### Project Structure

```
ezvibe/
├── bin/ezvibe.js              # CLI entry point (npx ezvibe)
├── server/
│   ├── index.ts               # Express + Socket.io + auth
│   ├── session-manager.ts     # PTY lifecycle + buffer management
│   └── socket-handlers.ts     # WebSocket event routing
├── src/
│   ├── app/                   # Next.js App Router + API routes
│   ├── components/
│   │   ├── terminal/          # TerminalView (xterm.js), Toolbar
│   │   ├── context/           # Plans, Memory, Notes, Token tabs
│   │   ├── ideas/             # IdeaList, IdeaCard, IdeaForm
│   │   └── layout/            # AppShell, Sidebar
│   ├── hooks/                 # useSocket, useSessions, useIdeas
│   └── lib/                   # db, types, claude-data reader
└── package.json
```

---

## Roadmap

- [x] Light / dark theme
- [ ] Multiple terminal tabs per idea
- [ ] Smart status detection (active / waiting / idle)
- [ ] Auto-discover projects from `~/.claude/projects/`
- [ ] Session transcript viewer (parse JSONL)
- [ ] tmux backend for PTY persistence across restarts
- [ ] Claude Agent SDK integration
- [ ] Token cost tracking per idea
- [ ] Keyboard shortcuts (Cmd+1-5 to switch)

---

## Built With Claude Code

EZVibe was designed and built entirely through AI-assisted development using Claude Code + [Superpowers](https://github.com/anthropics/claude-plugins-official) plugin — from brainstorming to spec to implementation. The full design spec lives at [`docs/superpowers/specs/`](docs/superpowers/specs/).

---

## License

MIT — do whatever you want with it.
