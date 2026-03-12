# EZVibe

**Your AI Development Command Center** — Manage multiple Claude Code sessions and track ideas from inception to implementation, all in one browser tab.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

[中文文档](README_CN.md)

## The Problem

You're an AI-native developer running 2-5 projects in parallel with Claude Code. Each project lives in a different terminal. You're constantly switching tabs, losing context, and forgetting where you left off.

Existing tools (Claude Squad, CCManager) manage sessions but don't track *what you're building or why*.

## The Solution

EZVibe is a local web dashboard that combines:

- **Idea Lifecycle Management** — Track each idea through stages: Exploring → Planning → Implementing → Done
- **Embedded Claude Code Terminals** — Full xterm.js terminals running Claude Code, right in your browser
- **Context Panel** — View Claude's Plans, Memory files, and your own Notes alongside the terminal

```
┌─────────────────────┬──────────────────────────────────┐
│  IDEAS               │  Terminal (xterm.js)              │
│                      │  $ claude                         │
│  ● EZVibe      ⚡    │  > Implementing feature...        │
│  ○ Trading     📋    │                                   │
│  ○ PEPO        💬    │──────────────────────────────────│
│                      │  [Plans] [Memory] [Notes]         │
│  + New Idea          │  # EZVibe Implementation Plan     │
│                      │  ## Step 1: Scaffold...           │
└─────────────────────┴──────────────────────────────────┘
```

## Key Differentiators

| | Cloud Claude Code | Claude Squad / CCManager | **EZVibe** |
|---|---|---|---|
| Form | Cloud web | Terminal TUI | **Local web app** |
| Perspective | Single session | Multi-session management | **Idea lifecycle** |
| Data | Cloud | Doesn't read ~/.claude/ | **Deep ~/.claude/ integration** |
| Context | No persistence | None | **Plans / Memory / Notes panel** |

## Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/ezvibe.git
cd ezvibe
npm install

# Start (launches both Next.js and PTY server)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Architecture

EZVibe runs two processes:

1. **Next.js App** (`:3000`) — UI, REST API, reads `~/.claude/` data
2. **PTY Sidecar** (`:3001`) — Express + Socket.io, manages real terminal sessions via `node-pty`

```
Browser (:3000)
  ├── REST API → Next.js (SQLite + ~/.claude/ reader)
  └── WebSocket → PTY Server (node-pty terminals)
```

This is the same architecture VS Code uses — the renderer talks to a separate process that manages PTYs.

### Security

- PTY server binds to `127.0.0.1` only (not exposed to network)
- WebSocket connections require an auth token (generated on startup)
- CORS restricted to `localhost:3000`

### Data

- Ideas, sessions, and notes are stored in `~/.ezvibe/ezvibe.db` (SQLite)
- Claude's Plans and Memory are read directly from `~/.claude/` (read-only)
- Terminal buffers are kept in memory for reconnection after page refresh

## Usage

### 1. Create an Idea

Click "+ New" in the sidebar. Give it a name and optionally a project path (the directory where Claude Code will run).

### 2. Start a Terminal

Click into an idea, then click "Start Claude Code". A real Claude Code session starts in the embedded terminal.

### 3. Work with Context

While coding in the terminal, switch to the tabs below:
- **Plans** — Browse all your Claude Code plans from `~/.claude/plans/`
- **Memory** — View the project's memory files from `~/.claude/projects/{key}/memory/`
- **Notes** — Write freeform notes (auto-saved)

### 4. Switch Between Ideas

Click any idea in the sidebar to switch. Your terminal sessions keep running in the background — switch back anytime and the buffer is restored.

### 5. Track Progress

Move ideas through stages as you go:
- **Exploring** — Brainstorming, chatting with LLMs
- **Planning** — Using Claude Code's plan mode, designing architecture
- **Implementing** — Building it
- **Done** — Shipped!

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Terminal | xterm.js 5 + WebGL |
| Data Fetching | SWR |
| Realtime | Socket.io |
| PTY | node-pty |
| Database | better-sqlite3 (WAL mode) |
| Sidecar | Express |

## Project Structure

```
ezvibe/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── api/                # REST API (ideas, notes, claude data)
│   │   ├── idea/[id]/          # Idea detail page (terminal + context)
│   │   └── ideas/              # Main dashboard
│   ├── components/
│   │   ├── context/            # ContextPanel, PlanTab, MemoryTab, NotesTab
│   │   ├── ideas/              # IdeaList, IdeaCard, IdeaForm
│   │   ├── layout/             # AppShell, Sidebar
│   │   └── terminal/           # TerminalView, TerminalToolbar
│   ├── hooks/                  # useIdeas, useSocket, useSessions
│   └── lib/                    # db, types, constants, claude-data
├── server/
│   ├── index.ts                # Express + Socket.io server
│   ├── session-manager.ts      # PTY lifecycle management
│   └── socket-handlers.ts      # WebSocket event routing
└── package.json
```

## Roadmap

- [ ] Multiple terminal tabs per idea
- [ ] Smart status detection (active / waiting / idle)
- [ ] Auto-discover existing projects from `~/.claude/projects/`
- [ ] Session history viewer (parse Claude's JSONL transcripts)
- [ ] tmux backend for PTY persistence across server restarts
- [ ] Claude Agent SDK integration
- [ ] Token cost tracking
- [ ] Light theme

## Requirements

- Node.js 18+
- `claude` CLI installed and in PATH ([Claude Code](https://claude.ai/code))
- macOS or Linux (node-pty requires a POSIX system)

## License

MIT
