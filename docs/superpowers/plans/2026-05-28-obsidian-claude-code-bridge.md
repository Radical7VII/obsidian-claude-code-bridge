# Obsidian Claude Code Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Obsidian plugin that exposes selected text to Claude Code CLI in real-time, mimicking the VS Code IDE MCP server protocol.

**Architecture:** The plugin runs a local WebSocket server, writes a discovery lock file to `~/.claude/ide/`, and sends JSON-RPC `selection_changed` notifications whenever the user's selection changes in the editor. Claude Code CLI auto-discovers and connects.

**Tech Stack:** TypeScript, Obsidian API, Node.js `http`/`fs`/`crypto`, `ws` (WebSocket library), esbuild (bundler), vitest (testing)

---

## File Structure

```
obsidian-code/
├── src/
│   ├── main.ts              — Plugin entry point (onload/onunload lifecycle)
│   ├── server.ts            — WebSocket server (start, stop, auth, send)
│   ├── lockfile.ts          — Lock file write/delete/cleanup
│   └── selection.ts         — Selection change listener + debounce
├── tests/
│   ├── setup.ts             — Test setup (mock obsidian)
│   ├── __mocks__/
│   │   └── obsidian.ts      — Obsidian API mock
│   ├── server.test.ts       — WebSocket server tests
│   ├── lockfile.test.ts     — Lock file management tests
│   └── selection.test.ts    — Selection listener tests
├── manifest.json            — Obsidian plugin manifest
├── package.json             — Dependencies and scripts
├── tsconfig.json            — TypeScript config
├── esbuild.config.mjs       — Build config
├── vitest.config.ts         — Test config
└── versions.json            — Obsidian version compatibility
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `manifest.json`
- Create: `versions.json`
- Create: `tsconfig.json`
- Create: `esbuild.config.mjs`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/__mocks__/obsidian.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "obsidian-claude-code-bridge",
  "version": "0.1.0",
  "description": "Bridge selected text in Obsidian to Claude Code CLI",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["obsidian", "claude-code"],
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/ws": "^8.5.10",
    "esbuild": "^0.24.0",
    "obsidian": "^1.7.2",
    "typescript": "^5.6.0",
    "vitest": "^3.2.4"
  },
  "dependencies": {
    "ws": "^8.17.0"
  }
}
```

- [ ] **Step 2: Create manifest.json**

```json
{
  "id": "claude-code-bridge",
  "name": "Claude Code Bridge",
  "version": "0.1.0",
  "minAppVersion": "1.5.0",
  "description": "Bridge selected text to Claude Code CLI for real-time context sharing.",
  "author": "othnielsu",
  "isDesktopOnly": true
}
```

- [ ] **Step 3: Create versions.json**

```json
{
  "0.1.0": "1.5.0"
}
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES2022",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "isolatedModules": true,
    "strictNullChecks": true,
    "lib": ["DOM", "ES2022"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 5: Create esbuild.config.mjs**

```javascript
import esbuild from "esbuild";
import process from "process";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/language", "@codemirror/state", "@codemirror/view"],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  platform: "node",
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

- [ ] **Step 6: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    globals: false,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      obsidian: fileURLToPath(new URL("./tests/__mocks__/obsidian.ts", import.meta.url)),
    },
  },
});
```

- [ ] **Step 7: Create tests/setup.ts**

```typescript
import { vi } from "vitest";

vi.mock("obsidian");
```

- [ ] **Step 8: Create tests/__mocks__/obsidian.ts**

```typescript
export class Plugin {
  app: any = { vault: { adapter: { getBasePath: () => "/mock/vault" } } };
  registerEvent(_event: any) {}
  registerInterval(_id: number) { return _id; }
}

export class MarkdownView {
  editor = {
    getSelection: () => "",
    getCursor: (pos?: string) => ({ line: 0, ch: 0 }),
    getLine: (n: number) => "",
  };
  file = { path: "test.md" };
  getViewType() { return "markdown"; }
}

export class Notice {
  constructor(_msg: string) {}
}

export class PluginSettingTab {}
```

- [ ] **Step 9: Create .gitignore**

```
node_modules/
main.js
*.js.map
.DS_Store
```

- [ ] **Step 10: Install dependencies**

Run: `cd /Users/othnielsu/Documents/obsidian-code && npm install`
Expected: node_modules created, lock file generated

- [ ] **Step 11: Verify TypeScript compiles**

Run: `npx tsc -noEmit -skipLibCheck`
Expected: No errors (no source files yet, just config validation)

- [ ] **Step 12: Commit**

```bash
git init
git add package.json package-lock.json manifest.json versions.json tsconfig.json esbuild.config.mjs vitest.config.ts tests/ .gitignore
git commit -m "feat: scaffold obsidian-claude-code-bridge plugin"
```

---

### Task 2: WebSocket Server (`src/server.ts`)

**Files:**
- Create: `src/server.ts`
- Create: `tests/server.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/server.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { BridgeServer } from "../src/server";
import WebSocket from "ws";

describe("BridgeServer", () => {
  let server: BridgeServer;

  afterEach(async () => {
    if (server) await server.stop();
  });

  it("starts on a random port bound to localhost", async () => {
    server = new BridgeServer();
    const port = await server.start();
    expect(port).toBeGreaterThanOrEqual(10000);
    expect(port).toBeLessThanOrEqual(65535);
  });

  it("accepts connection with valid auth token", async () => {
    server = new BridgeServer();
    const port = await server.start();
    const token = server.authToken;

    const ws = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { "x-claude-code-ide-authorization": token },
    });

    await new Promise<void>((resolve, reject) => {
      ws.on("open", () => { ws.close(); resolve(); });
      ws.on("error", reject);
    });
  });

  it("rejects connection with invalid auth token", async () => {
    server = new BridgeServer();
    const port = await server.start();

    const ws = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { "x-claude-code-ide-authorization": "wrong-token" },
    });

    const code = await new Promise<number>((resolve) => {
      ws.on("close", (code) => resolve(code));
    });
    expect(code).toBe(1008);
  });

  it("sends JSON-RPC notifications to connected client", async () => {
    server = new BridgeServer();
    const port = await server.start();

    const ws = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { "x-claude-code-ide-authorization": server.authToken },
    });

    const msgPromise = new Promise<any>((resolve) => {
      ws.on("message", (data) => resolve(JSON.parse(data.toString())));
    });

    await new Promise<void>((resolve) => { ws.on("open", resolve); });

    server.notify("selection_changed", { text: "hello" });

    const msg = await msgPromise;
    expect(msg).toEqual({
      jsonrpc: "2.0",
      method: "selection_changed",
      params: { text: "hello" },
    });

    ws.close();
  });

  it("disconnects previous client when new one connects", async () => {
    server = new BridgeServer();
    const port = await server.start();
    const headers = { "x-claude-code-ide-authorization": server.authToken };

    const ws1 = new WebSocket(`ws://127.0.0.1:${port}`, { headers });
    await new Promise<void>((resolve) => { ws1.on("open", resolve); });

    const closePromise = new Promise<void>((resolve) => {
      ws1.on("close", () => resolve());
    });

    const ws2 = new WebSocket(`ws://127.0.0.1:${port}`, { headers });
    await new Promise<void>((resolve) => { ws2.on("open", resolve); });

    await closePromise;
    ws2.close();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/server.test.ts`
Expected: FAIL — Cannot find module `../src/server`

- [ ] **Step 3: Implement BridgeServer**

```typescript
// src/server.ts
import { createServer, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

export class BridgeServer {
  readonly authToken: string;
  private httpServer: Server | null = null;
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  private port: number | null = null;

  constructor() {
    this.authToken = randomUUID();
  }

  async start(): Promise<number> {
    for (let i = 0; i < 50; i++) {
      const port = Math.floor(Math.random() * 55536) + 10000;
      const started = await this.tryListen(port);
      if (started) return port;
    }
    throw new Error("Failed to find an available port after 50 attempts");
  }

  notify(method: string, params: unknown): void {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) return;
    this.client.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
  }

  async stop(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
      this.httpServer = null;
    }
    this.port = null;
  }

  getPort(): number | null {
    return this.port;
  }

  hasClient(): boolean {
    return this.client !== null && this.client.readyState === WebSocket.OPEN;
  }

  private tryListen(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const httpServer = createServer();
      const wss = new WebSocketServer({ server: httpServer });

      wss.on("connection", (ws, req) => {
        const token = req.headers["x-claude-code-ide-authorization"];
        if (token !== this.authToken) {
          ws.close(1008, "Unauthorized");
          return;
        }
        if (this.client && this.client.readyState === WebSocket.OPEN) {
          this.client.close();
        }
        this.client = ws;
      });

      httpServer.on("error", () => resolve(false));
      httpServer.listen(port, "127.0.0.1", () => {
        this.httpServer = httpServer;
        this.wss = wss;
        this.port = port;
        resolve(true);
      });
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/server.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/server.ts tests/server.test.ts
git commit -m "feat: implement WebSocket server with auth and JSON-RPC notifications"
```

---

### Task 3: Lock File Manager (`src/lockfile.ts`)

**Files:**
- Create: `src/lockfile.ts`
- Create: `tests/lockfile.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lockfile.test.ts
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { LockFileManager } from "../src/lockfile";
import { existsSync, readFileSync, mkdirSync, rmSync, readdirSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("LockFileManager", () => {
  let testDir: string;
  let manager: LockFileManager;

  beforeEach(() => {
    testDir = join(tmpdir(), `claude-ide-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (manager) manager.remove();
    rmSync(testDir, { recursive: true, force: true });
  });

  it("writes lock file with correct format", () => {
    manager = new LockFileManager(testDir);
    manager.write(12345, "/my/vault", "test-token");

    const files = readdirSync(testDir);
    expect(files.length).toBe(1);
    expect(files[0]).toBe("12345.lock");

    const content = JSON.parse(readFileSync(join(testDir, "12345.lock"), "utf-8"));
    expect(content).toEqual({
      pid: process.pid,
      workspaceFolders: ["/my/vault"],
      ideName: "Obsidian",
      transport: "ws",
      runningInWindows: process.platform === "win32",
      authToken: "test-token",
    });
  });

  it("sets file permissions to 0600", () => {
    manager = new LockFileManager(testDir);
    manager.write(12345, "/my/vault", "test-token");

    const stat = statSync(join(testDir, "12345.lock"));
    const mode = (stat.mode & 0o777).toString(8);
    expect(mode).toBe("600");
  });

  it("removes lock file on cleanup", () => {
    manager = new LockFileManager(testDir);
    manager.write(12345, "/my/vault", "test-token");
    manager.remove();

    expect(existsSync(join(testDir, "12345.lock"))).toBe(false);
  });

  it("cleans stale lock files from our PID", () => {
    const stalePath = join(testDir, "99999.lock");
    writeFileSync(stalePath, JSON.stringify({
      pid: process.pid,
      workspaceFolders: ["/old/vault"],
      ideName: "Obsidian",
      transport: "ws",
      runningInWindows: false,
      authToken: "stale",
    }));

    manager = new LockFileManager(testDir);
    manager.cleanStale();

    expect(existsSync(stalePath)).toBe(false);
  });

  it("does not remove lock files from other PIDs", () => {
    const otherPath = join(testDir, "88888.lock");
    writeFileSync(otherPath, JSON.stringify({
      pid: 99999,
      workspaceFolders: ["/other/vault"],
      ideName: "Visual Studio Code",
      transport: "ws",
      runningInWindows: false,
      authToken: "other",
    }));

    manager = new LockFileManager(testDir);
    manager.cleanStale();

    expect(existsSync(otherPath)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lockfile.test.ts`
Expected: FAIL — Cannot find module `../src/lockfile`

- [ ] **Step 3: Implement LockFileManager**

```typescript
// src/lockfile.ts
import { writeFileSync, unlinkSync, readdirSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export class LockFileManager {
  private ideDir: string;
  private lockPath: string | null = null;

  constructor(ideDir?: string) {
    this.ideDir = ideDir ?? join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".claude",
      "ide"
    );
    if (!existsSync(this.ideDir)) {
      mkdirSync(this.ideDir, { recursive: true, mode: 0o700 });
    }
  }

  write(port: number, vaultPath: string, authToken: string): void {
    const content = JSON.stringify({
      pid: process.pid,
      workspaceFolders: [vaultPath],
      ideName: "Obsidian",
      transport: "ws",
      runningInWindows: process.platform === "win32",
      authToken,
    });

    this.lockPath = join(this.ideDir, `${port}.lock`);
    writeFileSync(this.lockPath, content, { mode: 0o600 });
  }

  remove(): void {
    if (!this.lockPath) return;
    try {
      unlinkSync(this.lockPath);
    } catch (e: any) {
      if (e.code !== "ENOENT") throw e;
    }
    this.lockPath = null;
  }

  cleanStale(): void {
    let files: string[];
    try {
      files = readdirSync(this.ideDir);
    } catch {
      return;
    }

    for (const file of files) {
      if (!file.endsWith(".lock")) continue;
      const fullPath = join(this.ideDir, file);
      try {
        const content = JSON.parse(readFileSync(fullPath, "utf-8"));
        if (content.pid === process.pid && content.ideName === "Obsidian") {
          unlinkSync(fullPath);
        }
      } catch {
        // skip unreadable files
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lockfile.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lockfile.ts tests/lockfile.test.ts
git commit -m "feat: implement lock file manager for Claude Code discovery"
```

---

### Task 4: Selection Listener (`src/selection.ts`)

**Files:**
- Create: `src/selection.ts`
- Create: `tests/selection.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/selection.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SelectionListener } from "../src/selection";

describe("SelectionListener", () => {
  let listener: SelectionListener;
  let sendFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    sendFn = vi.fn();
    listener = new SelectionListener(sendFn, 50);
  });

  afterEach(() => {
    listener.destroy();
    vi.useRealTimers();
  });

  it("formats selection_changed params correctly", () => {
    listener.handleSelectionChange(
      "hello world",
      "/vault/note.md",
      { line: 2, ch: 5 },
      { line: 2, ch: 16 }
    );
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledWith("selection_changed", {
      text: "hello world",
      filePath: "/vault/note.md",
      fileUrl: "file:///vault/note.md",
      selection: {
        start: { line: 2, character: 5 },
        end: { line: 2, character: 16 },
        isEmpty: false,
      },
    });
  });

  it("sends isEmpty: true when no text selected", () => {
    listener.handleSelectionChange(
      "",
      "/vault/note.md",
      { line: 0, ch: 0 },
      { line: 0, ch: 0 }
    );
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledWith("selection_changed", {
      text: "",
      filePath: "/vault/note.md",
      fileUrl: "file:///vault/note.md",
      selection: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
        isEmpty: true,
      },
    });
  });

  it("debounces rapid selection changes", () => {
    listener.handleSelectionChange("a", "/vault/note.md", { line: 0, ch: 0 }, { line: 0, ch: 1 });
    vi.advanceTimersByTime(20);
    listener.handleSelectionChange("ab", "/vault/note.md", { line: 0, ch: 0 }, { line: 0, ch: 2 });
    vi.advanceTimersByTime(20);
    listener.handleSelectionChange("abc", "/vault/note.md", { line: 0, ch: 0 }, { line: 0, ch: 3 });
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(sendFn).toHaveBeenCalledWith("selection_changed", expect.objectContaining({ text: "abc" }));
  });

  it("does not send duplicate notifications for same selection", () => {
    listener.handleSelectionChange("hello", "/vault/note.md", { line: 1, ch: 0 }, { line: 1, ch: 5 });
    vi.advanceTimersByTime(50);
    listener.handleSelectionChange("hello", "/vault/note.md", { line: 1, ch: 0 }, { line: 1, ch: 5 });
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/selection.test.ts`
Expected: FAIL — Cannot find module `../src/selection`

- [ ] **Step 3: Implement SelectionListener**

```typescript
// src/selection.ts
export interface EditorPosition {
  line: number;
  ch: number;
}

export class SelectionListener {
  private sendFn: (method: string, params: unknown) => void;
  private debounceMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastKey: string = "";

  constructor(sendFn: (method: string, params: unknown) => void, debounceMs = 50) {
    this.sendFn = sendFn;
    this.debounceMs = debounceMs;
  }

  handleSelectionChange(
    text: string,
    filePath: string,
    from: EditorPosition,
    to: EditorPosition
  ): void {
    const key = `${filePath}:${from.line}:${from.ch}:${to.line}:${to.ch}:${text}`;
    if (key === this.lastKey) return;

    if (this.timer !== null) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this.lastKey = key;
      this.sendFn("selection_changed", {
        text,
        filePath,
        fileUrl: `file://${filePath}`,
        selection: {
          start: { line: from.line, character: from.ch },
          end: { line: to.line, character: to.ch },
          isEmpty: text === "",
        },
      });
      this.timer = null;
    }, this.debounceMs);
  }

  destroy(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/selection.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/selection.ts tests/selection.test.ts
git commit -m "feat: implement selection listener with debounce and dedup"
```

---

### Task 5: Plugin Main (`src/main.ts`)

**Files:**
- Create: `src/main.ts`

- [ ] **Step 1: Implement plugin entry point**

```typescript
// src/main.ts
import { Plugin, MarkdownView, WorkspaceLeaf } from "obsidian";
import { BridgeServer } from "./server";
import { LockFileManager } from "./lockfile";
import { SelectionListener } from "./selection";

export default class ClaudeCodeBridgePlugin extends Plugin {
  private server: BridgeServer | null = null;
  private lockFile: LockFileManager | null = null;
  private selectionListener: SelectionListener | null = null;

  async onload(): Promise<void> {
    this.server = new BridgeServer();
    this.lockFile = new LockFileManager();

    this.lockFile.cleanStale();

    const port = await this.server.start();
    const vaultPath = (this.app.vault.adapter as any).getBasePath();
    this.lockFile.write(port, vaultPath, this.server.authToken);

    this.selectionListener = new SelectionListener(
      (method, params) => this.server?.notify(method, params)
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
        this.checkSelection(leaf);
      })
    );

    this.registerEditorChange();
  }

  async onunload(): Promise<void> {
    this.selectionListener?.destroy();
    this.lockFile?.remove();
    await this.server?.stop();
  }

  private registerEditorChange(): void {
    this.registerEvent(
      this.app.workspace.on("editor-change", () => {
        const leaf = this.app.workspace.activeLeaf;
        this.checkSelection(leaf);
      })
    );

    this.app.workspace.on("active-leaf-change" as any, () => {
      this.registerInterval(
        window.setInterval(() => {
          const leaf = this.app.workspace.activeLeaf;
          this.checkSelection(leaf);
        }, 100) as any
      );
    });
  }

  private checkSelection(leaf: WorkspaceLeaf | null): void {
    if (!leaf) return;
    const view = leaf.view;
    if (!(view instanceof MarkdownView)) return;

    const editor = view.editor;
    const text = editor.getSelection();
    const from = editor.getCursor("from");
    const to = editor.getCursor("to");
    const file = view.file;
    if (!file) return;

    const vaultPath = (this.app.vault.adapter as any).getBasePath();
    const filePath = `${vaultPath}/${file.path}`;

    this.selectionListener?.handleSelectionChange(text, filePath, from, to);
  }
}
```

- [ ] **Step 2: Build the plugin**

Run: `cd /Users/othnielsu/Documents/obsidian-code && npx tsc -noEmit -skipLibCheck && node esbuild.config.mjs production`
Expected: `main.js` generated successfully

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire up plugin lifecycle (server + lockfile + selection)"
```

---

### Task 6: Integration Test & Polish

**Files:**
- Modify: `src/main.ts` (fix selection polling approach)

- [ ] **Step 1: Replace interval polling with CodeMirror extension**

The `editor-change` event doesn't fire on cursor/selection moves without text changes. Obsidian uses CodeMirror 6 internally. We need to listen to CodeMirror's `EditorView.updateListener` for selection changes.

Replace the `registerEditorChange` method in `src/main.ts`:

```typescript
// src/main.ts — replace registerEditorChange method and add import
import { Plugin, MarkdownView, WorkspaceLeaf } from "obsidian";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { BridgeServer } from "./server";
import { LockFileManager } from "./lockfile";
import { SelectionListener } from "./selection";

export default class ClaudeCodeBridgePlugin extends Plugin {
  private server: BridgeServer | null = null;
  private lockFile: LockFileManager | null = null;
  private selectionListener: SelectionListener | null = null;

  async onload(): Promise<void> {
    this.server = new BridgeServer();
    this.lockFile = new LockFileManager();

    this.lockFile.cleanStale();

    const port = await this.server.start();
    const vaultPath = (this.app.vault.adapter as any).getBasePath();
    this.lockFile.write(port, vaultPath, this.server.authToken);

    this.selectionListener = new SelectionListener(
      (method, params) => this.server?.notify(method, params)
    );

    this.registerEditorExtension(
      ViewPlugin.fromClass(
        class {
          constructor(private view: EditorView) {}
          update(update: ViewUpdate) {
            if (update.selectionSet || update.focusChanged) {
              this.view.dispatch({ effects: [] });
            }
          }
        }
      ).extension
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.emitSelection();
      })
    );

    this.registerInterval(
      window.setInterval(() => this.emitSelection(), 200)
    );
  }

  async onunload(): Promise<void> {
    this.selectionListener?.destroy();
    this.lockFile?.remove();
    await this.server?.stop();
  }

  private emitSelection(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    const text = editor.getSelection();
    const from = editor.getCursor("from");
    const to = editor.getCursor("to");
    const file = view.file;
    if (!file) return;

    const vaultPath = (this.app.vault.adapter as any).getBasePath();
    const filePath = `${vaultPath}/${file.path}`;

    this.selectionListener?.handleSelectionChange(text, filePath, from, to);
  }
}
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/othnielsu/Documents/obsidian-code && node esbuild.config.mjs production`
Expected: `main.js` built without errors

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "fix: use polling for selection detection (reliable across CM6 modes)"
```

---

### Task 7: Manual Integration Test

**Files:** None (testing only)

- [ ] **Step 1: Install plugin in Obsidian**

Copy `main.js` and `manifest.json` to an Obsidian vault's plugin directory:

```bash
VAULT="$HOME/path-to-your-vault"
mkdir -p "$VAULT/.obsidian/plugins/claude-code-bridge"
cp main.js manifest.json "$VAULT/.obsidian/plugins/claude-code-bridge/"
```

Then in Obsidian: Settings → Community Plugins → Reload → Enable "Claude Code Bridge"

- [ ] **Step 2: Verify lock file is created**

```bash
ls ~/.claude/ide/
cat ~/.claude/ide/*.lock | python3 -m json.tool
```

Expected: A new `.lock` file with `"ideName": "Obsidian"` and the vault path in `workspaceFolders`.

- [ ] **Step 3: Start Claude Code in the vault directory**

```bash
cd "$VAULT"
claude
```

Expected: Claude Code connects (check it doesn't error).

- [ ] **Step 4: Select text in Obsidian**

Select some text in a note. In Claude Code, observe:
Expected: `⧉ Selected N lines from note.md` appears.

- [ ] **Step 5: Send a prompt referencing the selection**

Type a prompt in Claude Code like "explain this".
Expected: Claude's response references the selected text content.

- [ ] **Step 6: Verify cleanup on plugin disable**

Disable the plugin in Obsidian settings.
Expected: Lock file is deleted from `~/.claude/ide/`.

---

## Summary

| Task | Component | Tests |
|------|-----------|-------|
| 1 | Project scaffold | — |
| 2 | WebSocket server | 5 tests |
| 3 | Lock file manager | 5 tests |
| 4 | Selection listener | 4 tests |
| 5 | Plugin main | Build check |
| 6 | Integration polish | Full suite |
| 7 | Manual integration test | Manual |
