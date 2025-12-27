import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      plugins: process.env.ANALYZE
        ? [
            visualizer({
              filename: "dist/public/bundle-stats.html",
              open: false,
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : [],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
          ],
          charts: ["recharts"],
          utils: ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  server: {
    host: true,
    port: 3000,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            if (process.env.NODE_ENV !== "production")
              console.error("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            if (process.env.NODE_ENV !== "production")
              console.info(
                "Sending Request to the Target:",
                req.method,
                req.url
              );
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            if (process.env.NODE_ENV !== "production")
              console.info(
                "Received Response from the Target:",
                proxyRes.statusCode
              );
          });
        },
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
  },
});
