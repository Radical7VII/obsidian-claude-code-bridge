# Obsidian Claude Code Bridge

[English](README.md) | 中文

一个 Obsidian 插件，将选中的文字实时传递给 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI。

在 Obsidian 中选中文字后，旁边终端里的 Claude Code 会自动显示 `⧉ Selected N lines from <file>`，并将选中内容作为上下文 — 体验与 VS Code 完全一致。

## 工作原理

插件模拟了 VS Code 的 IDE MCP 服务器协议：

1. 在 `127.0.0.1` 上启动一个本地 WebSocket 服务器
2. 写入发现锁文件到 `~/.claude/ide/{port}.lock`
3. Claude Code CLI 自动发现并连接
4. 选中内容变化时发送 JSON-RPC `selection_changed` 通知

## 安装

### 从源码构建

```bash
git clone https://github.com/Radical7VII/obsidian-claude-code-bridge.git
cd obsidian-claude-code-bridge
npm install
npm run build
```

### 安装到 Obsidian

```bash
VAULT="/你的vault路径"
mkdir -p "$VAULT/.obsidian/plugins/claude-code-bridge"
cp main.js manifest.json "$VAULT/.obsidian/plugins/claude-code-bridge/"
```

然后在 Obsidian 中：**设置 → 第三方插件 → 刷新 → 启用 "Claude Code Bridge"**

## 使用方法

1. 在 Obsidian 中启用插件
2. 打开一个终端，**切换到你的 vault 目录**
3. 运行 `claude`
4. 运行 `/ide` 连接到 Obsidian
5. 在 Obsidian 中选中文字 — Claude Code 会自动显示选中内容

> **注意：** Claude Code 必须从 vault 目录启动，否则无法匹配工作区。

## 开发

```bash
npm run dev        # 监听模式
npm run build      # 生产构建
npm test           # 运行测试
npm run test:watch # 监听测试
```

## 架构

```
┌─────────────────────┐       WebSocket (JSON-RPC 2.0)       ┌──────────────┐
│  Obsidian 插件      │ ◄──────────────────────────────────► │  Claude Code │
│                     │                                       │  CLI         │
│  - 选中监听器        │                                      │              │
│  - WS 服务器 (:port) │       锁文件自动发现                  │  自动检测     │
│  - 锁文件写入器      │ ────────────────────────────────────► │  并连接       │
└─────────────────────┘   ~/.claude/ide/{port}.lock           └──────────────┘
```

| 组件 | 文件 | 职责 |
|------|------|------|
| 服务器 | `src/server.ts` | WebSocket + MCP 协议握手 |
| 锁文件 | `src/lockfile.ts` | 发现文件管理 |
| 选中监听 | `src/selection.ts` | 防抖选中变化检测 |
| 主入口 | `src/main.ts` | 插件生命周期串联 |

## 许可证

MIT
