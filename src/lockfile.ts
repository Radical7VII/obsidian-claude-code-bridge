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
