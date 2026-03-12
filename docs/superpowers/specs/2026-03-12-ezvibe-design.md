# EZVibe — AI 开发指挥中心

## 概述

EZVibe 是一个本地 web 应用，为 AI-native 开发者提供 **Idea 全生命周期管理 + Claude Code 多会话编排**。它解决的核心问题是：同时并行推进 2-5 个项目时，需要在多个终端之间频繁切换、丢失上下文。

### 与现有工具的差异

| | 云端 Claude Code | Claude Squad/CCManager | EZVibe |
|---|---|---|---|
| 形态 | 云端 web | 终端 TUI | 本地 web app |
| 视角 | 单项目单会话 | 多会话管理 | Idea 全生命周期 |
| 数据 | 云端 | 不读 ~/.claude/ | 深度集成 ~/.claude/ |
| 上下文 | 无持久化 | 无 | Plan/Memory/Notes 面板 |

## 架构

### 双进程设计

```
Browser (:3000)
  ├── IdeaList (左栏)
  └── TerminalView + ContextPanel (右栏)
        │
        ├── REST → Next.js API Routes (:3000)
        │           ├── Idea CRUD (SQLite)
        │           └── ClaudeDataReader (~/.claude/)
        │
        └── WebSocket → PTY Server (:3001)
                         ├── SessionManager
                         └── node-pty × N
```

**为什么双进程？** node-pty 是 C++ 原生模块，无法被 Next.js webpack 打包。PTY Server 是独立 Express 进程，通过 Socket.io 与前端通信。与 VS Code 架构相同。

### 安全模型

PTY Server 在本地运行，执行真实 shell 命令，必须防止未授权访问：

1. **Origin 限制**：Socket.io 配置 `cors: { origin: 'http://localhost:3000' }`，拒绝其他来源连接
2. **共享密钥**：PTY Server 启动时生成随机 token 写入 `~/.ezvibe/.auth-token`。Next.js 读取此 token 通过 server-side props 传给客户端。Socket.io handshake 时验证 `auth.token`
3. **仅本地监听**：PTY Server 绑定 `127.0.0.1`，不暴露到网络

### 数据模型

**Idea** — 核心实体

```sql
CREATE TABLE ideas (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  stage         TEXT NOT NULL DEFAULT 'exploring',  -- exploring | planning | implementing | done
  project_path  TEXT,
  claude_project_key TEXT,  -- ~/.claude/projects/ 下的编码路径
  color         TEXT DEFAULT '#6366f1',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  archived      INTEGER DEFAULT 0
);
```

**Session** — PTY 会话

```sql
CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,
  idea_id       TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  pid           INTEGER,
  status        TEXT DEFAULT 'starting',  -- MVP: starting | active | dead
  cwd           TEXT,
  started_at    TEXT NOT NULL,
  ended_at      TEXT
);
```

> MVP 中 status 只使用 `starting | active | dead` 三种状态。`waiting | idle` 的启发式检测推迟到后续迭代。

**Note** — Idea 笔记

```sql
CREATE TABLE notes (
  id            TEXT PRIMARY KEY,
  idea_id       TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  content       TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### TypeScript 接口

```typescript
interface Idea {
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

interface Session {
  id: string;
  ideaId: string;
  pid: number | null;
  status: 'starting' | 'active' | 'dead';
  cwd: string;
  startedAt: string;
  endedAt: string | null;
}

interface Note {
  id: string;
  ideaId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// WebSocket 事件 payload
interface TerminalInput { data: string }
interface TerminalResize { cols: number; rows: number }
interface SessionCreate { ideaId: string; cwd: string }
interface SessionKill { sessionId: string }
interface TerminalOutput { data: string }
interface SessionStatus { sessionId: string; status: Session['status'] }
interface SessionExit { sessionId: string; code: number }
interface SessionError { sessionId: string; message: string }
```

### ~/.claude/ 数据集成

通过 `ClaudeDataReader` 服务读取：

- **Memory**: `~/.claude/projects/{key}/memory/MEMORY.md` + 子文件
- **Plans**: `~/.claude/plans/*.md`
- **Session Lock**: `~/.claude/projects/{key}/*.lock` — 检测活跃会话
- **History**: `~/.claude/history.jsonl` — 按项目过滤

**路径编码规则**：Claude Code 将绝对路径中的所有 `/` 替换为 `-`。例如：
- `/Users/zcheng256/EZVibe/EZVibe` → `-Users-zcheng256-EZVibe-EZVibe`
- 注意开头的 `/` 也被替换，所以编码结果以 `-` 开头
- 路径中原有的 `-` 保持不变（不做转义）

```typescript
function projectPathToClaudeKey(projectPath: string): string {
  return projectPath.replace(/\//g, '-');
}
```

### 存储位置

```
~/.ezvibe/
  ├── ezvibe.db       # SQLite 数据库
  ├── .auth-token     # PTY Server 认证 token（每次启动重新生成）
  └── config.json     # 用户配置（可选，MVP 不实现）
```

### REST API 路由

```
GET    /api/ideas              — 获取所有 idea（支持 ?stage= 筛选）
POST   /api/ideas              — 创建 idea { name, description, projectPath }
GET    /api/ideas/:id          — 获取单个 idea
PATCH  /api/ideas/:id          — 更新 idea（name, description, stage, projectPath, archived）
DELETE /api/ideas/:id          — 删除 idea（级联删除 sessions 和 notes）

GET    /api/ideas/:id/notes    — 获取 idea 的所有笔记
POST   /api/ideas/:id/notes    — 创建笔记 { content }
PATCH  /api/notes/:id          — 更新笔记 { content }
DELETE /api/notes/:id          — 删除笔记

GET    /api/claude/memory/:projectKey  — 获取项目的 memory 文件列表和内容
GET    /api/claude/plans               — 获取所有 plan 文件列表
GET    /api/claude/plans/:filename     — 获取单个 plan 内容
```

## UI 设计

### 整体布局

左右双栏：
- **左栏 (35%)**：Idea 列表，带阶段筛选 (All | 探索 | 规划 | 实现 | 完成)
- **右栏 (65%)**：上半部 = xterm.js 终端，下半部 = 上下文 Tab 面板

### 关键组件

- `IdeaList` — 可筛选的 idea 卡片列表
- `IdeaCard` — 显示名称、阶段标签、会话状态（绿点=活跃，红点=死亡，无点=无会话）
- `TerminalView` — xterm.js + WebGL 渲染 + FitAddon 自适应 + Socket.io 通信
- `ContextPanel` — Tab 切换：Plan | Memory | Notes
- `TerminalToolbar` — 新建会话、终止

### Idea 生命周期

```
💬 探索 → 📋 规划 → ⚡ 实现 → ✅ 完成
```

每个阶段可以启动对应的 Claude Code 会话。阶段手动切换。

## 终端管理

### 启动 Claude Code

```typescript
const pty = nodePty.spawn(
  process.env.SHELL || '/bin/zsh',
  ['-l', '-c', 'claude'],
  {
    name: 'xterm-256color',
    cols, rows,  // 从客户端 FitAddon 获取的实际尺寸
    cwd: projectPath,
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' }
  }
);
```

使用 login shell (`-l`) 确保 PATH 包含 claude CLI。

**启动失败处理**：
1. PTY `exit` 事件在启动后 3 秒内触发 → 判定为启动失败
2. 服务端发送 `session:error { message: "Claude Code 启动失败，请检查 claude 是否已安装并在 PATH 中" }`
3. 前端在终端区域显示红色错误提示 + "重试"按钮
4. 如果 `projectPath` 不存在，在创建 session 前就校验并返回错误

### WebSocket 事件

```
Client → Server:
  terminal:input    { data }        — 键盘输入
  terminal:resize   { cols, rows }  — 终端大小变化
  session:create    { ideaId, cwd } — 创建新会话
  session:kill      { sessionId }   — 终止会话

Server → Client:
  terminal:output   { data }        — PTY 输出
  session:status    { sessionId, status }
  session:exit      { sessionId, code }
  session:error     { sessionId, message } — 启动失败或运行时错误
```

### 终端 Resize 流程

```
浏览器窗口 resize
  → xterm FitAddon.fit() 计算新的 cols/rows
  → emit terminal:resize { cols, rows }
  → server: pty.resize(cols, rows)
```

FitAddon 使用 `ResizeObserver` 监听容器大小变化，自动触发 resize。

### WebSocket 路由（多 Idea 切换）

使用 Socket.io rooms 实现：

1. 每个 session 是一个 room: `session:{sessionId}`
2. 当用户切换到某个 idea 时：
   - 前端 `leave` 当前 session room
   - `join` 新 session 的 room
   - 服务端重发新 session 的缓冲区
3. PTY 输出只 emit 到对应 session room 内的 sockets
4. 未被任何 socket 监听的 PTY 仍在后台运行，输出缓存在内存 buffer

### 断线重连

**MVP 简化方案**：

1. PTY 进程在 sidecar server 中持续运行，不受浏览器刷新影响
2. SessionManager 维护内存中的滚动缓冲区（~100KB，不持久化到磁盘）
3. 重连/切换 session 时，发送缓冲区恢复终端显示
4. 如果 sidecar 重启，所有 PTY 进程死亡，session 标记为 dead。用户需要手动启动新会话。这在 MVP 中可以接受。

### 状态检测（MVP）

MVP 只检测两种状态：
- **active** (绿色)：PID 存在且进程活跃（通过 `kill(pid, 0)` 验证）
- **dead** (红色)：PTY 退出或 PID 不存在

后续迭代增加 waiting/idle 的启发式检测。

## 优雅关闭

当 sidecar server 收到 SIGTERM/SIGINT 时：

```typescript
process.on('SIGTERM', () => shutdown());
process.on('SIGINT', () => shutdown());

async function shutdown() {
  // 1. 停止接受新连接
  io.close();
  // 2. 向所有 PTY 发送 SIGHUP
  for (const session of sessions.values()) {
    session.pty.kill('SIGHUP');
  }
  // 3. 等待 2 秒让进程退出
  await sleep(2000);
  // 4. SIGKILL 未退出的进程
  for (const session of sessions.values()) {
    try { process.kill(session.pid, 'SIGKILL'); } catch {}
  }
  // 5. 更新 DB 中所有 session 为 dead
  db.exec("UPDATE sessions SET status = 'dead', ended_at = datetime('now') WHERE status != 'dead'");
  // 6. 关闭 DB
  db.close();
  process.exit(0);
}
```

## 错误处理策略

| 场景 | 处理 |
|---|---|
| PTY Server 未运行 | 前端 Socket.io 自动重连（3次），失败后显示"PTY Server 离线"横幅 + 重试按钮 |
| claude CLI 不在 PATH | PTY 启动后立即退出，触发 session:error，前端显示安装指引 |
| 项目路径不存在 | 创建 session 前校验，返回 400 + 错误信息 |
| ~/.claude/ 目录不存在 | ClaudeDataReader 返回空数据，Memory/Plan Tab 显示"未找到 Claude 数据" |
| SQLite 锁定 | better-sqlite3 是同步 API，单进程访问不会有锁问题。配置 `journal_mode=WAL` 以防万一 |
| PTY 意外退出 | session:exit 事件通知前端，更新状态为 dead，终端显示退出信息 |

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Next.js 15 (App Router) |
| UI 样式 | Tailwind CSS |
| 终端渲染 | xterm.js 5 + WebGL addon + FitAddon |
| 数据获取 | SWR（idea/session 变更后调用 `mutate()` 刷新缓存） |
| 通信 | Socket.io |
| PTY 管理 | node-pty |
| 数据库 | better-sqlite3 (WAL mode) |
| 后端 sidecar | Express |
| 开发工具 | TypeScript, concurrently, tsx |

## MVP 范围

### 包含

1. **Idea CRUD** — 创建/编辑/删除/归档，阶段管理
2. **单终端** — 每个 idea 启动一个 Claude Code 终端
3. **断线重连** — 刷新页面后恢复终端状态（内存缓冲区回放）
4. **Memory Tab** — 只读显示 ~/.claude/ 下的 memory 文件
5. **Plan Tab** — 只读显示 ~/.claude/plans/ 下的计划文件
6. **Notes Tab** — 可编辑笔记，存 SQLite
7. **安全** — 本地监听 + origin 限制 + token 认证
8. **暗色主题** — 仅暗色

### 不包含（后续迭代）

- 多会话切换（一个 idea 多个终端 tab）
- HistoryTab（转录文件太大，需要分页流式解析）
- 智能状态检测（waiting/idle 启发式）
- 自动发现 ~/.claude/ 下的已有项目
- 拖拽排序
- 亮色主题
- tmux 后端（PTY 持久化跨服务器重启）
- Claude Agent SDK 集成
- Cost tracking
- config.json 配置系统

## 实现顺序

| 天 | 内容 |
|---|---|
| Day 1 | 脚手架 (Next.js 15 + Tailwind) + SQLite schema + Idea CRUD API + IdeaList/IdeaCard 组件 + AppShell 双栏布局 |
| Day 2 | Express sidecar (安全: token + origin) + SessionManager (spawn/kill/buffer) + xterm.js TerminalView + Socket.io 通信 + resize 支持 |
| Day 3 | 断线重连 (buffer replay) + WebSocket room 路由 + ClaudeDataReader + Memory/Plan/Notes Tab |
| Day 4 | 错误处理 (全场景) + 优雅关闭 + 状态指示器 (active/dead) + 布局调整 + 端到端测试 |

## 关键风险

1. **node-pty + Next.js 不兼容** → 双进程架构完全绕过
2. **刷新丢失终端** → 内存缓冲区回放 + sidecar 保活
3. **WebSocket 安全** → origin 限制 + 启动 token + 仅本地监听
4. **多终端性能** → 只渲染当前活跃终端，其他在后台静默运行
5. **大 JSONL 文件** → 流式解析 + 分页（推迟到 MVP 后）
6. **claude CLI 路径** → login shell (-l) 确保 PATH 正确

## 验证方式

1. `npm run dev` 启动 Next.js + PTY Server（concurrently）
2. 创建新 Idea，输入名称和项目路径
3. 点击进入 Idea，启动 Claude Code 终端
4. 在终端中与 Claude Code 正常交互（输入命令、查看输出）
5. 调整浏览器窗口大小，验证终端自适应 resize
6. 刷新页面，验证终端状态恢复（缓冲区回放）
7. 切换到另一个 Idea，验证 WebSocket room 切换
8. 切换到 Memory/Plan Tab，验证 ~/.claude/ 数据正确显示
9. 在 Notes Tab 写入内容，刷新后验证持久化
10. 关闭 PTY Server (Ctrl+C)，验证优雅关闭（所有 PTY 被清理）
