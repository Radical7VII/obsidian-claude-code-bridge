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
