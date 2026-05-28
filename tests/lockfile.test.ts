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
