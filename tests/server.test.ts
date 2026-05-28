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
