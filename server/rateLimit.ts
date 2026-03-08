import type { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [key: string]: RateLimitStore } = {};

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000,
    max = 100,
    message = "Too many requests, please try again later.",
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || "unknown",
  } = options;

  const storeName = `${windowMs}-${max}`;
  if (!stores[storeName]) {
    stores[storeName] = {};
  }
  const store = stores[storeName];

  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    const remaining = Math.max(0, max - store[key].count);
    const resetTime = Math.ceil((store[key].resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetTime.toString());

    if (store[key].count > max) {
      res.setHeader("Retry-After", resetTime.toString());
      return res.status(429).json({ 
        success: false, 
        error: message,
        retryAfter: resetTime 
      });
    }

    next();
  };
}

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many API requests. Please wait a moment.",
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many search requests. Please slow down.",
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many uploads. Please wait before uploading more.",
});
