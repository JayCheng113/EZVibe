# EZVibe

**你的 AI 开发指挥中心** — 在一个浏览器标签页里管理多个 Claude Code 会话，追踪每个想法从诞生到落地的全过程。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

[English](README.md)

## 痛点

你是一个 AI-native 开发者，同时并行推进 2-5 个项目。每个项目在不同的终端里跑着 Claude Code。你不停地切 tab、丢失上下文、忘记做到哪了。

现有工具（Claude Squad、CCManager、Codeman）只管会话，不追踪*你在做什么、为什么做*。它们是多路复用器，不是指挥中心。

## 解决方案

EZVibe 是一个本地 web 仪表盘，三合一：

- **Idea 生命周期管理** — 追踪每个想法的阶段：探索 → 规划 → 实现 → 完成
- **内嵌 Claude Code 终端** — 完整的 xterm.js 终端，真正的 Claude Code 会话直接跑在浏览器里
- **上下文面板** — 终端旁边同时查看 Claude 的计划、记忆文件和你自己的笔记
- **深度 `~/.claude/` 集成** — 直接读取你现有的 Claude Code 数据（计划、记忆、会话历史）

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
| 控制 | 单终端 | 切换终端 | **内嵌终端 + 上下文** |

## 快速开始

### 环境要求

- **Node.js 18+**
- **Claude Code CLI** 已安装且在 PATH 中 — [安装 Claude Code](https://claude.ai/code)
- **macOS 或 Linux**（node-pty 需要 POSIX 系统）

### 安装和运行

```bash
git clone https://github.com/yourusername/ezvibe.git
cd ezvibe
npm install
npm run dev
```

这会同时启动两个进程：
- **Next.js** 在 `http://localhost:3000`（UI + API）
- **PTY 服务器** 在 `http://localhost:3001`（终端管理）

在浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 使用指南

### 第一步：创建你的第一个 Idea

点击左侧边栏的 **"+ 新建"** 按钮。

填写：
- **名称**（必填）— 例如 "我的交易机器人"
- **描述**（可选）— 这个想法是关于什么的
- **项目路径**（可选）— 项目目录的绝对路径，例如 `/Users/you/projects/trading-bot`。Claude Code 将在这个目录下运行。

> **提示：** 如果设置了项目路径，EZVibe 会自动从 `~/.claude/` 读取该项目的 Claude Code 记忆和计划。

### 第二步：启动 Claude Code

1. 点击侧边栏中的 idea 卡片进入详情
2. 点击工具栏中的 **"启动 Claude Code"**
3. 一个真实的 Claude Code 会话在内嵌终端中启动
4. 像正常终端一样输入和交互 — 完整的键盘支持、颜色、回滚

```
┌──────────────────────────────────────────────┐
│  TerminalToolbar: [EZVibe ⚡ 实现] ● Active   │
│  [停止]                                       │
├──────────────────────────────────────────────┤
│  $ claude                                     │
│  ╭─────────────────────────────────────╮      │
│  │  Claude Code  (EZVibe project)      │      │
│  ╰─────────────────────────────────────╯      │
│  claude> 帮我实现登录页面                       │
│  ✓ 正在读取 src/app/login/page.tsx             │
│  ✓ 正在创建登录表单组件...                       │
└──────────────────────────────────────────────┘
```

### 第三步：使用上下文面板

在终端下方，你会看到三个标签页：

| 标签页 | 显示内容 | 数据来源 |
|---|---|---|
| **计划** | 所有 Claude Code 计划（可展开的手风琴列表） | `~/.claude/plans/*.md` |
| **记忆** | 项目相关的记忆文件 | `~/.claude/projects/{key}/memory/` |
| **笔记** | 你的自由笔记（输入时自动保存） | SQLite 数据库 |

这意味着你可以在与 Claude Code 交互的*同时*查看实施计划或项目笔记 — 不再需要切换窗口。

### 第四步：管理多个 Idea

- **切换：** 点击侧边栏中任意 idea — 终端即时切换，缓冲区自动恢复
- **后台运行：** 切换走后终端会话继续在后台运行
- **阶段：** 从详情页更新 idea 的阶段（探索 → 规划 → 实现 → 完成）
- **状态：** 绿点 = 活跃会话，红点 = 已结束，无点 = 无会话

### 第五步：典型工作流

```
1. 有了一个新想法
   └─ 在 EZVibe 中创建（阶段：探索 💬）

2. 与 ChatGPT 或其他 LLM 头脑风暴
   └─ 把关键洞察粘贴到笔记标签页

3. 打开 Claude Code 终端，使用 plan mode
   └─ 更新阶段为 规划 📋
   └─ 计划自动出现在计划标签页

4. 开始实现
   └─ 更新阶段为 实现 ⚡
   └─ Claude Code 在内嵌终端中运行
   └─ 记忆/计划/笔记全部可见

5. 完成！
   └─ 更新阶段为 完成 ✅
```

## 架构

### 为什么是双进程？

EZVibe 采用**双进程架构**，与 VS Code 使用相同的模式：

```
┌─────────────────── 浏览器 (localhost:3000) ───────────────┐
│                                                             │
│   ┌─────────────┐         ┌────────────────────────────┐   │
│   │  IdeaList    │         │  TerminalView (xterm.js)   │   │
│   │  IdeaCard    │         │  ContextPanel              │   │
│   │  StageFilter │         │   [计划|记忆|笔记]          │   │
│   └──────┬──────┘         └──────────┬─────────────────┘   │
│          │ REST (SWR)                │ WebSocket (Socket.io)│
└──────────┼───────────────────────────┼─────────────────────┘
           │                           │
           ▼                           ▼
┌────────────────────┐    ┌────────────────────────┐
│   Next.js :3000    │    │   PTY 服务器 :3001      │
│                    │    │   (Express + Socket.io) │
│  App Router 页面   │    │                        │
│  REST API 路由     │    │  SessionManager        │
│  SQLite (ideas,    │    │   ├─ PTY #1 (claude)   │
│   notes, sessions) │    │   ├─ PTY #2 (claude)   │
│  ClaudeDataReader  │    │   └─ PTY #3 (claude)   │
│   (读取 ~/.claude) │    │                        │
└────────┬───────────┘    │  缓冲区管理             │
         │                │  Socket.io rooms       │
         ▼                └──────────┬─────────────┘
┌────────────────────────────────────┼──────────────────┐
│  文件系统                           │                  │
│                                    ▼                  │
│  ~/.ezvibe/                  ~/.claude/               │
│   ├── ezvibe.db               ├── projects/           │
│   └── .auth-token             │   └── {key}/memory/   │
│                               ├── plans/              │
│                               └── history.jsonl       │
└───────────────────────────────────────────────────────┘
```

**为什么不用一个进程？** `node-pty` 是一个 C++ 原生插件，用于生成真实的 OS 伪终端。Next.js 用 webpack 打包服务端代码，会破坏原生插件。将 PTY 服务器分离出来完全避免了这个问题 — 每个进程各司其职。

### 数据流

**创建终端会话：**
```
用户点击"启动 Claude Code"
  → 前端通过 Socket.io 发送 session:create
  → PTY 服务器执行: zsh -l -c claude（在项目目录中）
  → PTY 输出通过 WebSocket 流式传输到 xterm.js
  → 用户按键通过 WebSocket 回传到 PTY stdin
```

**页面刷新后重连：**
```
页面刷新 → Socket.io 重连
  → 前端发送 session:attach
  → PTY 服务器发送缓冲的输出（~100KB 滚动缓冲区）
  → xterm.js 回放缓冲区 → 终端状态恢复
  → 实时输出继续
```

**切换 Idea：**
```
用户点击侧边栏中不同的 idea
  → 前端发送 session:detach（旧）+ session:attach（新）
  → Socket.io 离开旧 room，加入新 room
  → 新会话的缓冲区回放到终端
  → 上下文面板获取新 idea 的计划/记忆/笔记
```

### 安全模型

在 web 端口上运行 PTY 服务器需要严格的安全措施：

1. **仅限本地** — PTY 服务器绑定 `127.0.0.1:3001`，而非 `0.0.0.0`
2. **认证 Token** — 启动时生成，写入 `~/.ezvibe/.auth-token`，WebSocket 握手时必须提供
3. **CORS** — Socket.io 仅接受来自 `http://localhost:3000` 的连接

### 核心组件

| 组件 | 文件 | 职责 |
|---|---|---|
| **SessionManager** | `server/session-manager.ts` | PTY 生命周期：创建、终止、缓冲、状态、数据库同步 |
| **TerminalView** | `src/components/terminal/TerminalView.tsx` | xterm.js 渲染、Socket.io 管道、尺寸调整 |
| **ClaudeDataReader** | `src/lib/claude-data.ts` | 读取 `~/.claude/` 目录（计划、记忆） |
| **AppShell** | `src/components/layout/AppShell.tsx` | 双栏布局（侧边栏 + 主区域） |
| **ContextPanel** | `src/components/context/ContextPanel.tsx` | 标签页面板：计划 / 记忆 / 笔记 |

## 这个项目是怎么构建的

EZVibe 完全通过 AI 辅助开发构建，使用 Claude Code 配合 [Superpowers](https://github.com/anthropics/claude-plugins-official) 插件：

1. **头脑风暴** — 使用 `superpowers:brainstorming` 技能探索问题空间，对比方案（CLI vs web vs VSCode 扩展），确定了 Idea Board + 内嵌终端的设计
2. **调研** — 调研了现有工具（Claude Squad、CCManager、Codeman、Amux）和技术（Claude Agent SDK、xterm.js、node-pty）
3. **设计** — 撰写了详细的设计文档，涵盖架构、数据模型、API 路由、组件层级、错误处理和安全模型。通过自动化的文档审查进行了校验。
4. **规划** — 使用 `superpowers:writing-plans` 创建了 7 步实施计划
5. **实现** — 使用 `superpowers:subagent-driven-development` 执行 — 每一步由独立的 subagent 实现，然后审查规格合规性和代码质量
6. **测试** — 18 个端到端测试，覆盖所有 API 端点、错误处理和 Claude 数据集成

完整设计文档：[`docs/superpowers/specs/2026-03-12-ezvibe-design.md`](docs/superpowers/specs/2026-03-12-ezvibe-design.md)

## 技术栈

| 层 | 技术 | 选型原因 |
|---|---|---|
| 前端框架 | Next.js 15 (App Router) | 最佳 AI 辅助开发生态，SSR + API 路由 |
| UI 样式 | Tailwind CSS | 快速开发暗色主题 |
| 终端渲染 | xterm.js 5 + WebGL + FitAddon | 行业标准 web 终端，GPU 加速 |
| 数据获取 | SWR | 自动重新验证，乐观更新 |
| 实时通信 | Socket.io | 可靠的 WebSocket，自动重连 |
| 终端管理 | node-pty | 真实 OS 伪终端（与 VS Code 相同） |
| 数据库 | better-sqlite3 (WAL) | 零配置，同步 API，WAL 支持并发 |
| 后端 Sidecar | Express | 轻量 HTTP 服务器，隔离原生插件 |

## 项目结构

```
ezvibe/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/
│   │   │   ├── ideas/              #   Idea CRUD（列表、创建、获取、更新、删除）
│   │   │   ├── notes/              #   笔记 CRUD
│   │   │   ├── claude/             #   Claude 数据读取（计划、记忆）
│   │   │   └── auth-token/         #   PTY 服务器认证 token 代理
│   │   ├── idea/[id]/              #   Idea 详情页（终端 + 上下文）
│   │   └── ideas/                  #   主仪表盘
│   ├── components/
│   │   ├── context/                #   ContextPanel, PlanTab, MemoryTab, NotesTab
│   │   ├── ideas/                  #   IdeaList, IdeaCard, IdeaForm
│   │   ├── layout/                 #   AppShell（35/65 分栏）, Sidebar
│   │   └── terminal/               #   TerminalView (xterm.js), TerminalToolbar
│   ├── hooks/
│   │   ├── useIdeas.ts             #   SWR hook，Idea 增删改查
│   │   ├── useSocket.ts            #   Socket.io 客户端连接
│   │   └── useSessions.ts          #   终端会话管理
│   └── lib/
│       ├── db.ts                   #   SQLite 初始化、建表、WAL 模式
│       ├── types.ts                #   TypeScript 接口（Idea, Session, Note, WS 事件）
│       ├── constants.ts            #   阶段定义、颜色、标签
│       └── claude-data.ts          #   ~/.claude/ 目录读取器
├── server/
│   ├── index.ts                    #   Express + Socket.io + 认证 + 优雅关闭
│   ├── session-manager.ts          #   PTY 创建/终止/缓冲/状态/数据库同步
│   └── socket-handlers.ts          #   WebSocket 事件路由 + room 管理
├── docs/
│   └── superpowers/specs/          #   设计规格文档
└── package.json                    #   npm run dev = 同时启动 Next.js + PTY 服务器
```

## 路线图

- [ ] 每个 Idea 多终端标签页
- [ ] 智能状态检测（活跃 / 等待输入 / 空闲）
- [ ] 自动发现 `~/.claude/projects/` 下的已有项目
- [ ] 会话转录查看器（解析 Claude 的 JSONL 文件）
- [ ] tmux 后端（PTY 持久化跨服务器重启）
- [ ] Claude Agent SDK 集成（程序化控制）
- [ ] Token 消耗追踪
- [ ] 亮色主题
- [ ] 快捷键（Cmd+1-5 切换 Idea）

## 许可

MIT
