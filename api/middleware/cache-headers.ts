import type { Request, Response, NextFunction } from "express";

// Public routes that should have CDN caching
const PUBLIC_ROUTES = [
  "/api/announcements",
  "/api/travel-data",
  "/api/files",
  "/api/file-history",
];

// Private/auth routes that should NOT be cached
const PRIVATE_ROUTES = [
  "/api/auth",
  "/api/users",
  "/api/admin",
  "/api/profile",
];

/**
 * Add Cache-Control headers for CDN and browser caching
 * Only applies to public GET endpoints
 */
export function apiCacheHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next();
  }

  // Check if route is private
  const isPrivateRoute = PRIVATE_ROUTES.some((route) =>
    req.path.startsWith(route)
  );

  if (isPrivateRoute) {
    // Private routes: no caching
    res.setHeader(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return next();
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    req.path.startsWith(route)
  );

  if (isPublicRoute) {
    // Public routes: CDN caching with stale-while-revalidate
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  }

  next();
}
