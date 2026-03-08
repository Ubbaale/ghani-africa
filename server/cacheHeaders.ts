import type { Request, Response, NextFunction } from "express";

export function cacheControl(maxAge: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
    } else {
      res.setHeader("Cache-Control", "no-store");
    }
    next();
  };
}

export function noCacheHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}

export function staticCacheHeaders(maxAge: number = 31536000) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, immutable`);
    next();
  };
}

const PUBLIC_ENDPOINTS = [
  "/api/products",
  "/api/categories",
  "/api/stores",
  "/api/products/featured",
  "/api/geo",
  "/api/advertisements",
];

export function apiCacheHeaders(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET") {
    res.setHeader("Cache-Control", "no-store");
    return next();
  }

  const isPublic = PUBLIC_ENDPOINTS.some(endpoint => req.path.startsWith(endpoint));
  
  if (isPublic) {
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  } else {
    res.setHeader("Cache-Control", "private, no-cache");
  }
  next();
}
