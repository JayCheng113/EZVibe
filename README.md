# EZVibe

**Your AI Development Command Center** — Manage multiple Claude Code sessions and track ideas from inception to implementation, all in one browser tab.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

[中文文档](README_CN.md)

## The Problem

You're an AI-native developer running 2-5 projects in parallel with Claude Code. Each project lives in a different terminal. You're constantly switching tabs, losing context, and forgetting where you left off.

Existing tools (Claude Squad, CCManager, Codeman) manage sessions but don't track *what you're building or why*. They're multiplexers, not command centers.

## The Solution

EZVibe is a local web dashboard that combines:

- **Idea Lifecycle Management** — Track each idea through stages: Exploring → Planning → Implementing → Done
- **Embedded Claude Code Terminals** — Full xterm.js terminals running real Claude Code sessions in your browser
- **Context Panel** — View Claude's Plans, Memory files, and your own Notes alongside the terminal
- **Deep `~/.claude/` Integration** — Reads your existing Claude Code data (plans, memory, session history) directly

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
| Control | One terminal | Switch terminals | **Embedded terminals + context** |

## Quick Start

### Prerequisites

- **Node.js 18+**
- **Claude Code CLI** installed and in PATH — [Install Claude Code](https://claude.ai/code)
- **macOS or Linux** (node-pty requires a POSIX system)

### Install & Run

```bash
git clone https://github.com/yourusername/ezvibe.git
cd ezvibe
npm install
npm run dev
```

This starts two processes simultaneously:
- **Next.js** on `http://localhost:3000` (UI + API)
- **PTY Server** on `http://localhost:3001` (terminal management)

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Step 1: Create Your First Idea

Click the **"+ New"** button in the left sidebar.

Fill in:
- **Name** (required) — e.g., "My Trading Bot"
- **Description** (optional) — What this idea is about
- **Project Path** (optional) — Absolute path to the project directory, e.g., `/Users/you/projects/trading-bot`. This is where Claude Code will run.

> **Tip:** If you set a project path, EZVibe will automatically read that project's Claude Code memory and plans from `~/.claude/`.

### Step 2: Launch Claude Code

1. Click on an idea card in the sidebar to open it
2. Click **"Start Claude Code"** in the toolbar
3. A real Claude Code session launches in the embedded terminal
4. Type and interact just like a normal terminal — full keyboard support, colors, scrollback

```
┌──────────────────────────────────────────────┐
│  TerminalToolbar: [EZVibe ⚡ 实现] ● Active   │
│  [Stop]                                       │
├──────────────────────────────────────────────┤
│  $ claude                                     │
│  ╭─────────────────────────────────────╮      │
│  │  Claude Code  (EZVibe project)      │      │
│  ╰─────────────────────────────────────╯      │
│  claude> help me implement the login page     │
│  ✓ Reading src/app/login/page.tsx             │
│  ✓ Creating login form component...           │
└──────────────────────────────────────────────┘
```

### Step 3: Use the Context Panel

Below the terminal, you'll find three tabs:

| Tab | What it shows | Source |
|---|---|---|
| **Plans** | All Claude Code plans (expandable accordion) | `~/.claude/plans/*.md` |
| **Memory** | Project-specific memory files | `~/.claude/projects/{key}/memory/` |
| **Notes** | Your freeform notes (auto-saved on typing) | SQLite database |

This means you can read your implementation plan or project notes *while* interacting with Claude Code — no more switching windows.

### Step 4: Manage Multiple Ideas

- **Switch:** Click any idea in the sidebar — the terminal switches instantly, buffer restored
- **Background:** Terminal sessions keep running when you switch away
- **Stage:** Update an idea's stage (Exploring → Planning → Implementing → Done) from the detail page
- **Status:** Green dot = active session, Red dot = dead session, No dot = no session

### Step 5: Typical Workflow

```
1. Have a new idea
   └─ Create it in EZVibe (stage: Exploring 💬)

2. Brainstorm with ChatGPT or another LLM
   └─ Paste key insights into the Notes tab

3. Open Claude Code terminal, use plan mode
   └─ Update stage to Planning 📋
   └─ Plans appear in the Plans tab automatically

4. Start implementing
   └─ Update stage to Implementing ⚡
   └─ Claude Code runs in the embedded terminal
   └─ Memory/Plans/Notes all visible alongside

5. Done!
   └─ Update stage to Done ✅
```

## Architecture

### Why Two Processes?

EZVibe uses a **dual-process architecture**, the same pattern VS Code uses:

```
┌─────────────────── Browser (localhost:3000) ───────────────┐
│                                                             │
│   ┌─────────────┐         ┌────────────────────────────┐   │
│   │  IdeaList    │         │  TerminalView (xterm.js)   │   │
│   │  IdeaCard    │         │  ContextPanel              │   │
│   │  StageFilter │         │   [Plans|Memory|Notes]     │   │
│   └──────┬──────┘         └──────────┬─────────────────┘   │
│          │ REST (SWR)                │ WebSocket (Socket.io)│
└──────────┼───────────────────────────┼─────────────────────┘
           │                           │
           ▼                           ▼
┌────────────────────┐    ┌────────────────────────┐
│   Next.js :3000    │    │   PTY Server :3001     │
│                    │    │   (Express + Socket.io) │
│  App Router pages  │    │                        │
│  REST API routes   │    │  SessionManager        │
│  SQLite (ideas,    │    │   ├─ PTY #1 (claude)   │
│   notes, sessions) │    │   ├─ PTY #2 (claude)   │
│  ClaudeDataReader  │    │   └─ PTY #3 (claude)   │
│   (reads ~/.claude)│    │                        │
└────────┬───────────┘    │  Buffer management     │
         │                │  Socket.io rooms       │
         ▼                └──────────┬─────────────┘
┌────────────────────────────────────┼──────────────────┐
│  File System                       │                  │
│                                    ▼                  │
│  ~/.ezvibe/                  ~/.claude/               │
│   ├── ezvibe.db               ├── projects/           │
│   └── .auth-token             │   └── {key}/memory/   │
│                               ├── plans/              │
│                               └── history.jsonl       │
└───────────────────────────────────────────────────────┘
```

**Why not one process?** `node-pty` is a C++ native addon that spawns real OS pseudo-terminals. Next.js bundles server code with webpack, which breaks native addons. Separating the PTY server avoids this entirely — each process uses the right tool for the job.

### Data Flow

**Creating a terminal session:**
```
User clicks "Start Claude Code"
  → Frontend emits session:create via Socket.io
  → PTY Server spawns: zsh -l -c claude (in project directory)
  → PTY output streams via WebSocket to xterm.js
  → User keystrokes flow back via WebSocket to PTY stdin
```

**Reconnecting after page refresh:**
```
Page refreshes → Socket.io reconnects
  → Frontend emits session:attach
  → PTY Server sends buffered output (~100KB rolling buffer)
  → xterm.js replays buffer → terminal state restored
  → Live output resumes
```

**Switching between ideas:**
```
User clicks different idea in sidebar
  → Frontend emits session:detach (old) + session:attach (new)
  → Socket.io leaves old room, joins new room
  → New session's buffer replayed into terminal
  → Context panel fetches new idea's plans/memory/notes
```

### Security Model

Running a PTY server on a web port requires careful security:

1. **Localhost only** — PTY server binds to `127.0.0.1:3001`, not `0.0.0.0`
2. **Auth token** — Generated on startup, written to `~/.ezvibe/.auth-token`, required for WebSocket handshake
3. **CORS** — Socket.io only accepts connections from `http://localhost:3000`

### Key Components

| Component | File | Responsibility |
|---|---|---|
| **SessionManager** | `server/session-manager.ts` | PTY lifecycle: spawn, kill, buffer, status, DB sync |
| **TerminalView** | `src/components/terminal/TerminalView.tsx` | xterm.js rendering, Socket.io piping, resize handling |
| **ClaudeDataReader** | `src/lib/claude-data.ts` | Reads `~/.claude/` directory (plans, memory) |
| **AppShell** | `src/components/layout/AppShell.tsx` | Two-column layout (sidebar + main) |
| **ContextPanel** | `src/components/context/ContextPanel.tsx` | Tabbed panel: Plans / Memory / Notes |

## How This Project Was Built

EZVibe was designed and built entirely through AI-assisted development using Claude Code with the [Superpowers](https://github.com/anthropics/claude-plugins-official) plugin:

1. **Brainstorming** — Used the `superpowers:brainstorming` skill to explore the problem space, compare approaches (CLI vs web vs VSCode extension), and decide on the Idea Board + Embedded Terminal design
2. **Research** — Surveyed existing tools (Claude Squad, CCManager, Codeman, Amux) and technologies (Claude Agent SDK, xterm.js, node-pty)
3. **Design** — Wrote a detailed spec with architecture, data models, API routes, component hierarchy, error handling, and security model. Reviewed with automated spec reviewer.
4. **Planning** — Created a 7-step implementation plan using `superpowers:writing-plans`
5. **Implementation** — Executed using `superpowers:subagent-driven-development` — each step was implemented by a fresh subagent, then reviewed for spec compliance and code quality
6. **Testing** — 18 end-to-end tests covering all API endpoints, error handling, and Claude data integration

The full design spec is at [`docs/superpowers/specs/2026-03-12-ezvibe-design.md`](docs/superpowers/specs/2026-03-12-ezvibe-design.md).

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Best AI-assisted dev ecosystem, SSR + API routes |
| Styling | Tailwind CSS | Rapid dark theme development |
| Terminal | xterm.js 5 + WebGL + FitAddon | Industry standard web terminal, GPU-accelerated |
| Data Fetching | SWR | Auto-revalidation, optimistic updates |
| Realtime | Socket.io | Reliable WebSocket with auto-reconnect |
| PTY | node-pty | Real OS pseudo-terminals (same as VS Code) |
| Database | better-sqlite3 (WAL) | Zero-config, synchronous API, WAL for concurrency |
| Sidecar | Express | Lightweight HTTP server for native addon isolation |

## Project Structure

```
ezvibe/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/
│   │   │   ├── ideas/              #   Idea CRUD (list, create, get, update, delete)
│   │   │   ├── notes/              #   Notes CRUD
│   │   │   ├── claude/             #   Claude data reader (plans, memory)
│   │   │   └── auth-token/         #   PTY server auth token proxy
│   │   ├── idea/[id]/              #   Idea detail page (terminal + context)
│   │   └── ideas/                  #   Main dashboard
│   ├── components/
│   │   ├── context/                #   ContextPanel, PlanTab, MemoryTab, NotesTab
│   │   ├── ideas/                  #   IdeaList, IdeaCard, IdeaForm
│   │   ├── layout/                 #   AppShell (35/65 split), Sidebar
│   │   └── terminal/               #   TerminalView (xterm.js), TerminalToolbar
│   ├── hooks/
│   │   ├── useIdeas.ts             #   SWR hook for idea CRUD
│   │   ├── useSocket.ts            #   Socket.io client connection
│   │   └── useSessions.ts          #   Terminal session management
│   └── lib/
│       ├── db.ts                   #   SQLite init, schema, WAL mode
│       ├── types.ts                #   TypeScript interfaces (Idea, Session, Note, WS events)
│       ├── constants.ts            #   Stage definitions, colors, labels
│       └── claude-data.ts          #   ~/.claude/ directory reader
├── server/
│   ├── index.ts                    #   Express + Socket.io + auth + graceful shutdown
│   ├── session-manager.ts          #   PTY spawn/kill/buffer/status/DB sync
│   └── socket-handlers.ts          #   WebSocket event routing + room management
├── docs/
│   └── superpowers/specs/          #   Design specification
└── package.json                    #   npm run dev = concurrently Next.js + PTY server
```

## Roadmap

- [ ] Multiple terminal tabs per idea
- [ ] Smart status detection (active / waiting for input / idle)
- [ ] Auto-discover existing projects from `~/.claude/projects/`
- [ ] Session transcript viewer (parse Claude's JSONL files)
- [ ] tmux backend for PTY persistence across server restarts
- [ ] Claude Agent SDK integration (programmatic control)
- [ ] Token cost tracking per idea
- [ ] Light theme
- [ ] Keyboard shortcuts (Cmd+1-5 to switch ideas)

## License

MIT
