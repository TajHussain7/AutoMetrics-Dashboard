import "dotenv/config"; // Load env vars first
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

// No external DB required for local development (in-memory storage)

const port = process.env.PORT || 8000;

async function main() {
  const app = express();

  // CORS setup
  app.use(
    cors({
      origin: process.env.NODE_ENV === "production" ? false : "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Register API routes (keeps existing backend logic intact)
  await registerRoutes(app);

  const server = createServer(app);

  if (process.env.NODE_ENV !== "production") {
    // In dev, use Vite middleware so frontend HMR and backend run on same port
    await setupVite(app, server);
    server.listen(port, () => {
      console.log(`Dev server running: http://localhost:${port}`);
      console.log("Environment:", {
        NODE_ENV: process.env.NODE_ENV,
        PORT: port,
      });
    });
  } else {
    // In production, serve static built client
    serveStatic(app);
    server.listen(port, () => {
      console.log(`Server running: http://localhost:${port}`);
    });
  }
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
