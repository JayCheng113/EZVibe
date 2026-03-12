# EZVibe

**你的 AI 开发指挥中心** — 在一个浏览器标签页里管理多个 Claude Code 会话，追踪每个想法从诞生到落地的全过程。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

[English](README.md)

## 痛点

你是一个 AI-native 开发者，同时并行推进 2-5 个项目。每个项目在不同的终端里跑着 Claude Code。你不停地切 tab、丢失上下文、忘记做到哪了。

现有工具（Claude Squad、CCManager）只管会话，不追踪*你在做什么、为什么做*。

## 解决方案

EZVibe 是一个本地 web 仪表盘，三合一：

- **Idea 生命周期管理** — 追踪每个想法的阶段：探索 → 规划 → 实现 → 完成
- **内嵌 Claude Code 终端** — 完整的 xterm.js 终端，Claude Code 直接跑在浏览器里
- **上下文面板** — 终端旁边同时查看 Claude 的计划、记忆文件和你自己的笔记

```
┌─────────────────────┬──────────────────────────────────┐
│  IDEAS               │  终端 (xterm.js)                  │
│                      │  $ claude                         │
│  ● EZVibe      ⚡    │  > 正在实现功能...                  │
│  ○ Trading     📋    │                                   │
│  ○ PEPO        💬    │──────────────────────────────────│
│                      │  [计划] [记忆] [笔记]              │
│  + 新建 Idea         │  # EZVibe 实施计划                 │
│                      │  ## 第一步：脚手架...               │
└─────────────────────┴──────────────────────────────────┘
```

## 核心差异

| | 云端 Claude Code | Claude Squad / CCManager | **EZVibe** |
|---|---|---|---|
| 形态 | 云端 web | 终端 TUI | **本地 web 应用** |
| 视角 | 单项目单会话 | 多会话管理 | **Idea 全生命周期** |
| 数据 | 云端 | 不读 ~/.claude/ | **深度集成 ~/.claude/** |
| 上下文 | 无持久化 | 无 | **计划/记忆/笔记面板** |

## 快速开始

```bash
# 克隆并安装
git clone https://github.com/yourusername/ezvibe.git
cd ezvibe
npm install

# 启动（同时启动 Next.js 和 PTY 服务器）
npm run dev
```

在浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 工作原理

### 架构

EZVibe 运行两个进程：

1. **Next.js 应用** (`:3000`) — UI、REST API、读取 `~/.claude/` 数据
2. **PTY Sidecar** (`:3001`) — Express + Socket.io，通过 `node-pty` 管理真实终端会话

```
浏览器 (:3000)
  ├── REST API → Next.js (SQLite + ~/.claude/ 读取)
  └── WebSocket → PTY 服务器 (node-pty 终端)
```

这和 VS Code 的架构一样 — 渲染进程和管理 PTY 的进程分离。

### 安全

- PTY 服务器仅绑定 `127.0.0.1`（不暴露到网络）
- WebSocket 连接需要认证 token（启动时自动生成）
- CORS 限制为 `localhost:3000`

### 数据存储

- Idea、会话、笔记存储在 `~/.ezvibe/ezvibe.db`（SQLite）
- Claude 的计划和记忆从 `~/.claude/` 目录直接读取（只读）
- 终端缓冲区保存在内存中，刷新页面后自动恢复

## 使用方法

### 1. 创建 Idea

点击侧边栏的 "+ 新建"。输入名称，可选填项目路径（Claude Code 的工作目录）。

### 2. 启动终端

点击进入某个 idea，然后点击"启动 Claude Code"。一个真实的 Claude Code 会话在内嵌终端中启动。

### 3. 查看上下文

在终端中写代码的同时，切换下方的标签页：
- **计划** — 浏览 `~/.claude/plans/` 下的所有 Claude Code 计划
- **记忆** — 查看项目的 memory 文件 `~/.claude/projects/{key}/memory/`
- **笔记** — 写自由笔记（自动保存）

### 4. 切换 Idea

点击侧边栏的任意 idea 即可切换。终端会话在后台持续运行 — 随时切回来，缓冲区自动恢复。

### 5. 追踪进度

随着工作推进，切换 idea 的阶段：
- **💬 探索** — 头脑风暴，和 LLM 对话
- **📋 规划** — 使用 Claude Code 的 plan mode，设计架构
- **⚡ 实现** — 写代码
- **✅ 完成** — 上线！

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Next.js 15 (App Router) |
| UI 样式 | Tailwind CSS |
| 终端渲染 | xterm.js 5 + WebGL |
| 数据获取 | SWR |
| 实时通信 | Socket.io |
| 终端管理 | node-pty |
| 数据库 | better-sqlite3 (WAL mode) |
| 后端 sidecar | Express |

## 项目结构

```
ezvibe/
├── src/
│   ├── app/                    # Next.js App Router 页面 + API 路由
│   │   ├── api/                # REST API (ideas, notes, claude 数据)
│   │   ├── idea/[id]/          # Idea 详情页（终端 + 上下文）
│   │   └── ideas/              # 主仪表盘
│   ├── components/
│   │   ├── context/            # 上下文面板：计划、记忆、笔记
│   │   ├── ideas/              # Idea 列表、卡片、表单
│   │   ├── layout/             # 应用外壳、侧边栏
│   │   └── terminal/           # 终端视图、工具栏
│   ├── hooks/                  # useIdeas, useSocket, useSessions
│   └── lib/                    # 数据库、类型、常量、Claude 数据读取
├── server/
│   ├── index.ts                # Express + Socket.io 服务器
│   ├── session-manager.ts      # PTY 生命周期管理
│   └── socket-handlers.ts      # WebSocket 事件路由
└── package.json
```

## 路线图

- [ ] 每个 Idea 多终端标签页
- [ ] 智能状态检测（活跃/等待/空闲）
- [ ] 自动发现 `~/.claude/projects/` 下的已有项目
- [ ] 会话历史查看器（解析 Claude 的 JSONL 转录文件）
- [ ] tmux 后端（PTY 持久化跨服务器重启）
- [ ] Claude Agent SDK 集成
- [ ] Token 消耗追踪
- [ ] 亮色主题

## 环境要求

- Node.js 18+
- `claude` CLI 已安装且在 PATH 中 ([Claude Code](https://claude.ai/code))
- macOS 或 Linux（node-pty 需要 POSIX 系统）

## 许可

MIT
