import { createClient } from "redis";
import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { info, error as errorLogger } from "../utils/logger.js";

// Redis client setup
let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisConnected = false;

// Initialize Redis connection
async function initRedis() {
  if (redisClient) return redisClient;

  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            errorLogger("Redis: Max reconnection attempts reached");
            return new Error("Redis connection failed");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {
      errorLogger("Redis Client Error:", err);
      isRedisConnected = false;
    });

    redisClient.on("connect", () => {
      info("✅ Redis connected successfully");
      isRedisConnected = true;
    });

    redisClient.on("reconnecting", () => {
      info("⚠️ Redis reconnecting...");
      isRedisConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    errorLogger("Failed to initialize Redis:", err);
    isRedisConnected = false;
    return null;
  }
}

// Generate cache key from route and query
function generateCacheKey(req: Request): string {
  const routeKey = req.originalUrl || req.url;
  const queryString = JSON.stringify(req.query);
  const hash = createHash("md5").update(queryString).digest("hex").slice(0, 8);
  return `cache:${routeKey}:${hash}`;
}

// Redis READ-THROUGH cache middleware
export function redisCache(ttl: number = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip if Redis is not connected
    if (!isRedisConnected || !redisClient) {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      // Try to get from cache (HIT)
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Cache HIT - return cached response
        const parsed = JSON.parse(cachedData);
        return res.status(200).json(parsed);
      }

      // Cache MISS - continue to API and store response
      const originalJson = res.json.bind(res);

      res.json = function (data: any) {
        // Store in Redis asynchronously (fire and forget)
        if (isRedisConnected && redisClient && res.statusCode === 200) {
          redisClient
            .setEx(cacheKey, ttl, JSON.stringify(data))
            .catch((err) => {
              errorLogger("Redis cache set error:", err);
            });
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      // On error, bypass cache and continue
      errorLogger("Redis cache middleware error:", err);
      next();
    }
  };
}

// Invalidate cache for specific pattern
export async function invalidateCache(pattern: string) {
  if (!isRedisConnected || !redisClient) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      info(`Cache invalidated: ${keys.length} keys`);
    }
  } catch (err) {
    errorLogger("Cache invalidation error:", err);
  }
}

// Export init function
export { initRedis };
