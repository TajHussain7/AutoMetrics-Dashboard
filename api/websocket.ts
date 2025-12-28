import { Server as HTTPServer } from "http";
import * as ws from "ws";
import { debug, info, isDev } from "./utils/logger.js";

interface BroadcastMessage {
  type: string;
  data: any;
}

class AnnouncementWebSocketServer {
  private wss: any;
  private clients: Set<InstanceType<typeof import("ws")>> = new Set();
  private debugMode = isDev;

  constructor(server: HTTPServer) {
    info("🔧 Starting Announcement WebSocket server");

    this.wss = new ws.WebSocketServer({ server, path: "/ws/announcements" });

    info("✅ Announcement WS running");

    if (this.debugMode) {
      debug("✅ WebSocketServer created");
    }

    this.wss.on("connection", (client: InstanceType<typeof import("ws")>) => {
      const clientCount = this.clients.size + 1;
      debug(`\n🔗 [CLIENT CONNECTED] Total clients: ${clientCount}`);

      this.clients.add(client);

      // Send welcome message
      try {
        const welcomeMsg = JSON.stringify({
          type: "CONNECTED",
          message: "Connected to announcement server",
        });
        client.send(welcomeMsg);
        debug(`   └─ Welcome message sent to client`);
      } catch (sendErr) {
        console.error(`   └─ Failed to send welcome message:`, sendErr);
      }

      // Handle incoming messages from client
      client.on(
        "message",
        (message: Buffer | ArrayBuffer | Buffer[] | string) => {
          try {
            const text =
              typeof message === "string"
                ? message
                : Buffer.from(message as any).toString();
            const data = JSON.parse(text);
            debug(`   ├─ Message received: ${data.type || "UNKNOWN"}`);
          } catch (parseErr) {
            const len =
              typeof message === "string"
                ? message.length
                : Buffer.from(message as any).length;
            console.error(
              `   ├─ Failed to parse message (${len} bytes):`,
              parseErr
            );
          }
        }
      );

      // Handle client disconnect
      client.on("close", () => {
        this.clients.delete(client);
        const remaining = this.clients.size;
        debug(`\n❌ [CLIENT DISCONNECTED] Remaining clients: ${remaining}`);
      });

      // Handle WebSocket errors
      client.on("error", (err: Error) => {
        console.error(`\n⚠️  [WS ERROR]`, err.message);
        this.clients.delete(client);
        const remaining = this.clients.size;
        debug(`   └─ Removed client. Remaining: ${remaining}`);
      });
    });

    // Server-level error handling
    this.wss.on("error", (err: Error) => {
      console.error("❌ [WS SERVER ERROR]", err);
    });

    info("✅ WebSocket server ready");
  }

  broadcast(message: BroadcastMessage): number {
    if (this.clients.size === 0) {
      debug(`No clients connected, message not sent`, { type: message.type });
      return 0;
    }

    const payload = JSON.stringify(message);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    debug(
      `\n📢 [BROADCAST] Sending "${message.type}" to ${this.clients.size} client(s)`
    );

    let i = 0;
    this.clients.forEach((client) => {
      i++;
      if (client.readyState !== ws.OPEN) {
        debug(`   ├─ [${i}] ⊘ Skipped (state: ${client.readyState})`);
        skipCount++;
        return;
      }

      try {
        client.send(payload, (err?: Error) => {
          if (err) {
            console.error(`   ├─ [${i}] ✗ Send failed:`, err.message);
            errorCount++;
          } else {
            successCount++;
            if (this.debugMode) {
              debug(`   ├─ [${i}] ✓ Sent successfully`);
            }
          }
        });
      } catch (sendErr) {
        console.error(
          `   ├─ [${i}] ✗ Exception:`,
          sendErr instanceof Error ? sendErr.message : String(sendErr)
        );
        errorCount++;
      }
    });

    debug(
      `   └─ Summary: ✓${successCount} ✗${errorCount} ⊘${skipCount}/${this.clients.size}`
    );

    return successCount;
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export default AnnouncementWebSocketServer;
