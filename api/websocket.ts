import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface BroadcastMessage {
  type: string;
  data: any;
}

class AnnouncementWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private debugMode = true;

  constructor() {
    console.info("🔧 Starting Announcement WebSocket server on port 8081...");

    this.wss = new WebSocketServer({ port: 8081 });

    console.info("✅ Announcement WS running at ws://localhost:8081");

    if (this.debugMode) {
      console.debug("✅ WebSocketServer created");
    }

    this.wss.on("connection", (ws: WebSocket) => {
      const clientCount = this.clients.size + 1;
      console.debug(`\n🔗 [CLIENT CONNECTED] Total clients: ${clientCount}`);

      this.clients.add(ws);

      // Send welcome message
      try {
        const welcomeMsg = JSON.stringify({
          type: "CONNECTED",
          message: "Connected to announcement server",
        });
        ws.send(welcomeMsg);
        console.debug(`   └─ Welcome message sent to client`);
      } catch (sendErr) {
        console.error(`   └─ Failed to send welcome message:`, sendErr);
      }

      // Handle incoming messages from client
      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message);
          console.debug(`   ├─ Message received: ${data.type || "UNKNOWN"}`);
        } catch (parseErr) {
          console.error(
            `   ├─ Failed to parse message (${message.length} bytes):`,
            parseErr
          );
        }
      });

      // Handle client disconnect
      ws.on("close", () => {
        this.clients.delete(ws);
        const remaining = this.clients.size;
        console.debug(
          `\n❌ [CLIENT DISCONNECTED] Remaining clients: ${remaining}`
        );
      });

      // Handle WebSocket errors
      ws.on("error", (err) => {
        console.error(`\n⚠️  [WS ERROR]`, err.message);
        this.clients.delete(ws);
        const remaining = this.clients.size;
        console.debug(`   └─ Removed client. Remaining: ${remaining}`);
      });
    });

    // Server-level error handling
    this.wss.on("error", (err) => {
      console.error("❌ [WS SERVER ERROR]", err);
    });

    console.info("✅ WebSocket server ready");
  }

  broadcast(message: BroadcastMessage): number {
    if (this.clients.size === 0) {
      console.debug(
        `⚠️  [BROADCAST] No clients connected, message not sent (type: ${message.type})`
      );
      return 0;
    }

    const payload = JSON.stringify(message);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    console.debug(
      `\n📢 [BROADCAST] Sending "${message.type}" to ${this.clients.size} client(s)`
    );

    let i = 0;
    this.clients.forEach((client) => {
      i++;
      if (client.readyState !== WebSocket.OPEN) {
        console.debug(`   ├─ [${i}] ⊘ Skipped (state: ${client.readyState})`);
        skipCount++;
        return;
      }

      try {
        client.send(payload, (err) => {
          if (err) {
            console.error(`   ├─ [${i}] ✗ Send failed:`, err.message);
            errorCount++;
          } else {
            successCount++;
            if (this.debugMode) {
              console.debug(`   ├─ [${i}] ✓ Sent successfully`);
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

    console.debug(
      `   └─ Summary: ✓${successCount} ✗${errorCount} ⊘${skipCount}/${this.clients.size}`
    );

    return successCount;
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export default AnnouncementWebSocketServer;
