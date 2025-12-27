import "dotenv/config"; // Load env vars first
import { connectDB } from "./db.js";
import { User } from "./models/user.js";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import AnnouncementWebSocketServer from "./websocket.js";
import path from "path";
import { fileURLToPath } from "url";
import { debug, info } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8000;

// Initialize default admin user
async function initializeDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    // Accept multiple possible env names for the admin password to be resilient to typos
    const adminPassword =
      process.env.ADMIN_PASSWORD ||
      process.env.PASSWORD ||
      process.env.AMIN_PASSWORD ||
      process.env.PASS;

    if (!adminEmail || !adminPassword) {
      console.warn(
        "⚠️ Default admin credentials not found in .env (ADMIN_EMAIL and one of ADMIN_PASSWORD|PASSWORD|AMIN_PASSWORD|PASS)"
      );
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      info("✅ Default admin already exists:", adminEmail);
      return;
    }

    // Create default admin
    const defaultAdmin = new User({
      fullName: "Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      status: "active",
      company_name: "AutoMetrics",
    });

    await defaultAdmin.save();
    info("✅ Default admin created successfully:", adminEmail);
  } catch (error) {
    console.error("❌ Error initializing default admin:", error);
  }
}

async function main() {
  const app = express();

  // Connect to MongoDB
  try {
    await connectDB();
    console.info("MongoDB connection successful");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }

  // Initialize default admin user
  await initializeDefaultAdmin();

  // CORS setup
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || false
          : [
              "http://localhost:3000",
              "http://localhost:5173",
              "http://localhost:8000",
            ],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    })
  );

  // Body parsers and cookie parser

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Register API routes
  registerRoutes(app);

  // Log registered routes in development
  if (process.env.NODE_ENV !== "production") {
    debug(
      "Registered API routes:",
      app._router.stack
        .filter((r: any) => r.route)
        .map(
          (r: any) =>
            `${Object.keys(r.route.methods).join(",")} ${r.route.path}`
        )
    );
  }

  const server = createServer(app);

  // Initialize WebSocket server for real-time announcements
  const wsServer = new AnnouncementWebSocketServer();

  (global as any).__wsServer = wsServer;
  info("✅ WebSocket server initialized for announcements");

  // Serve uploaded attachment files
  app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

  if (process.env.NODE_ENV !== "production") {
    // In dev, use Vite middleware so frontend HMR and backend run on same port
    await setupVite(app, server);
    server.listen(port, () => {
      info(`Dev server running`);
      debug("Environment:", {
        NODE_ENV: process.env.NODE_ENV,
        PORT: port,
      });
    });
  } else {
    // In production, serve static built client
    serveStatic(app);
    server.listen(port, () => {
      info(`Server running`);
    });
  }
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
