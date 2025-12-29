import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { debug } from "./utils/logger.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("api/vite.ts must not be imported in production");
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  debug(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Lazily import Vite and the project vite config to avoid compile-time errors
  // in environments where devDependencies (like `vite`) are not installed.
  let createViteServer: any;
  let viteLogger: any = undefined;
  let viteConfig: any = {};

  try {
    const viteMod = await import("vite");
    createViteServer = viteMod.createServer;
    viteLogger = viteMod.createLogger ? viteMod.createLogger() : undefined;

    // Try to load project vite config (may not exist in server-only installs)
    try {
      // dynamic import prevents TS from needing the module at compile time
      viteConfig = (await import("../vite.config.ts")).default;
    } catch {
      viteConfig = {};
    }
  } catch (err) {
    // Re-throw to keep behavior consistent if setupVite is called but vite isn't available
    throw new Error(
      "Vite is not available in this environment. Ensure dev dependencies are installed or do not call setupVite in production."
    );
  }

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...(viteLogger || {}),
      // Use 'any' for parameters to avoid implicit any when LogOptions isn't available
      error: (msg: any, options?: any) => {
        viteLogger?.error?.(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  // Use a catch-all route but exclude /api routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip Vite middleware for API routes - let them be handled by API handlers
    if (url.startsWith("/api") || url.startsWith("/api/")) {
      log(`[Vite Middleware] Skipping for API route: ${url}`);
      return next();
    }
    log(`[Vite Middleware] Serving HTML for: ${url}`);

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // Transform the template without cache-busting to enable proper HMR
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the client build directory: ${distPath}. Make sure to build the client first (from the project root run: "npm run build" or "npm run build:client").`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
