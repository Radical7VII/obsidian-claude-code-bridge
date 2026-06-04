import { Plugin, MarkdownView } from "obsidian";
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

    // 打开或切换文件时立即推送一次活动文件信息（对齐 VS Code 扩展的
    // onDidChangeActiveTextEditor 行为），而不是只等下一次轮询。
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.emitSelection())
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.emitSelection())
    );

    // 轮询用于捕获光标/选中变化（Obsidian 没有原生的 cursorActivity 事件）。
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
