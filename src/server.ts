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
