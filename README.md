# Obsidian Claude Code Bridge

English | [中文](README_CN.md)

An Obsidian plugin that bridges selected text to [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI in real-time.

When you select text in Obsidian, the adjacent terminal running Claude Code automatically shows `⧉ Selected N lines from <file>` and includes the selection as context — just like VS Code.

## How It Works

The plugin mimics VS Code's IDE MCP server protocol:

1. Starts a local WebSocket server on `127.0.0.1`
2. Writes a discovery lock file to `~/.claude/ide/{port}.lock`
3. Claude Code CLI auto-discovers and connects
4. Selection changes are sent as JSON-RPC `selection_changed` notifications

## Installation

### Build from source

```bash
git clone https://github.com/othnielsu/obsidian-claude-code-bridge.git
cd obsidian-claude-code-bridge
npm install
npm run build
```

### Install to Obsidian

```bash
VAULT="/path/to/your/vault"
mkdir -p "$VAULT/.obsidian/plugins/claude-code-bridge"
cp main.js manifest.json "$VAULT/.obsidian/plugins/claude-code-bridge/"
```

Then in Obsidian: **Settings → Community Plugins → Reload → Enable "Claude Code Bridge"**

## Usage

1. Enable the plugin in Obsidian
2. Open a terminal **in your vault directory**
3. Run `claude`
4. Run `/ide` to connect to Obsidian
5. Select text in Obsidian — Claude Code will show the selection

> **Important:** Claude Code must be started from the vault directory for workspace matching to work.

## Development

```bash
npm run dev        # Watch mode
npm run build      # Production build
npm test           # Run tests
npm run test:watch # Watch tests
```

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

| Component | File | Responsibility |
|-----------|------|----------------|
| Server | `src/server.ts` | WebSocket + MCP protocol handshake |
| Lock File | `src/lockfile.ts` | Discovery file management |
| Selection | `src/selection.ts` | Debounced selection change detection |
| Main | `src/main.ts` | Plugin lifecycle wiring |

## License

MIT
