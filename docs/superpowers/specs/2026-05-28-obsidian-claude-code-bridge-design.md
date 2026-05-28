# Obsidian Claude Code Bridge — Design Spec

## Overview

An Obsidian plugin that bridges selected text in Obsidian to Claude Code CLI, providing real-time selection context — identical to the VS Code Claude Code extension experience.

When a user selects text in Obsidian, the adjacent terminal running Claude Code automatically displays "⧉ Selected N lines from <file>" and includes the selection as context in the next prompt.

## Architecture

```
┌─────────────────────┐       WebSocket (JSON-RPC 2.0)       ┌──────────────┐
│  Obsidian Plugin    │ ◄──────────────────────────────────► │  Claude Code │
│                     │                                       │  CLI         │
│  - Selection Listener                                      │              │
│  - WS Server (:port)│       Lock file auto-discovery       │  Auto-detect │
│  - Lock file writer │ ────────────────────────────────────► │  & connect   │
└─────────────────────┘   ~/.claude/ide/{port}.lock           └──────────────┘
```

## Protocol (reverse-engineered from VS Code extension v2.1.152)

### Lock File

- **Location:** `~/.claude/ide/{port}.lock`
- **Permissions:** 0600 (user-only read/write)
- **Format:**

```json
{
  "pid": 12345,
  "workspaceFolders": ["/Users/xxx/obsidian-vault"],
  "ideName": "Obsidian",
  "transport": "ws",
  "runningInWindows": false,
  "authToken": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

- `pid`: The Obsidian process PID
- `workspaceFolders`: Array containing the current Vault's absolute path
- `ideName`: `"Obsidian"`
- `transport`: `"ws"` (WebSocket)
- `authToken`: Random UUID v4, generated on each plugin activation

### WebSocket Server

- **Bind:** `127.0.0.1:{random_port}` (localhost only, not network-accessible)
- **Port range:** 10000–65535 (random, retry up to 50 times if occupied)
- **Auth:** Client must send header `x-claude-code-ide-authorization: {authToken}` on connection upgrade. Reject with close code 1008 if mismatched.

### JSON-RPC Notifications (Server → Client)

#### `selection_changed`

Sent whenever the user's text selection changes in the active editor.

```json
{
  "jsonrpc": "2.0",
  "method": "selection_changed",
  "params": {
    "text": "the selected text content",
    "filePath": "/absolute/path/to/note.md",
    "fileUrl": "file:///absolute/path/to/note.md",
    "selection": {
      "start": {"line": 5, "character": 0},
      "end": {"line": 8, "character": 12},
      "isEmpty": false
    }
  }
}
```

- `text`: The raw selected text
- `filePath`: Absolute filesystem path to the note
- `fileUrl`: File URI
- `selection.start/end`: 0-indexed line and character positions
- `selection.isEmpty`: `true` when cursor has no selection range

When selection is empty, still send the notification (so Claude Code clears its "selected" indicator).

## Components

### 1. WebSocket Server (`src/server.ts`)

- Start an HTTP server on a random available port bound to 127.0.0.1
- Upgrade to WebSocket using the `ws` library
- Validate auth token on connection via `x-claude-code-ide-authorization` header
- Allow only one active client connection (disconnect previous on new connection)
- Expose `send(method, params)` for sending JSON-RPC notifications

### 2. Lock File Manager (`src/lockfile.ts`)

- On server start: write lock file to `~/.claude/ide/{port}.lock` with mode 0600
- On plugin deactivate or server stop: delete the lock file
- Handle crash cleanup: on plugin activate, scan for stale lock files with our PID that shouldn't exist

### 3. Selection Listener (`src/selection.ts`)

- Register on Obsidian's `activeLeafChange` and editor `cursorActivity` events
- On selection change:
  - Get the active MarkdownView's editor
  - Extract selection text, file path, line/character positions
  - Debounce (50ms) to avoid flooding on rapid cursor movement
  - Send `selection_changed` notification via WebSocket

### 4. Plugin Main (`src/main.ts`)

- `onload()`: Initialize server → write lock file → start selection listener
- `onunload()`: Stop listener → close WebSocket connections → delete lock file → stop server

## Lifecycle

1. **Plugin activates** → Generate auth token → Start WS server → Write lock file
2. **Claude Code CLI starts** → Reads lock files in `~/.claude/ide/` → Finds matching workspace → Connects via WebSocket with auth header
3. **User selects text** → Plugin sends `selection_changed` → CLI shows "⧉ Selected N lines from file.md"
4. **User sends prompt** → CLI includes selection as context automatically
5. **Plugin deactivates** → Close connections → Delete lock file → Stop server

## Edge Cases

- **Multiple vaults open:** Each Obsidian window gets its own server instance with its own port/lock file. Claude Code matches by `workspaceFolders`.
- **Claude Code not running:** Notifications are sent to no one; no error. Server stays up waiting for connections.
- **Claude Code reconnects:** Previous connection closed gracefully, new one accepted.
- **Plugin crashes:** Lock file may become stale. On next activation, clean up any stale lock files matching our PID.
- **Port conflict:** Retry with a new random port (up to 50 attempts).

## Settings

- **Enable/Disable:** Toggle the bridge on/off without disabling the entire plugin
- **Debounce interval:** Configurable (default 50ms)

## Dependencies

- `ws` (WebSocket library) — bundled with esbuild
- Node.js `http`, `fs`, `path`, `crypto` — available in Obsidian's Node environment

## Out of Scope (v1)

- Bidirectional communication (Claude Code → Obsidian)
- MCP tool exposure (getDiagnostics, executeCode, openDiff)
- Multiple simultaneous CLI connections
- Open tabs / active file notifications
