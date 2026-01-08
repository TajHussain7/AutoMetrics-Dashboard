import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// From dist/api/static.js, go up to dist/, then into public/
const distPath = path.resolve(__dirname, "..", "public");

// Check if static files exist (for API-only vs full-stack mode)
export function hasStaticFiles(): boolean {
  return fs.existsSync(distPath);
}

export function serveStatic(app: Express) {
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
