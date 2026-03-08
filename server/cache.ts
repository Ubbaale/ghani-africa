import memoizee from "memoizee";

const CACHE_TTL = 60 * 1000;
const CACHE_MAX = 500;

type CacheOptions = {
  ttl?: number;
  max?: number;
};

const caches = new Map<string, ReturnType<typeof memoizee>>();

export function createCache<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  options: CacheOptions = {}
): T {
  const { ttl = CACHE_TTL, max = CACHE_MAX } = options;
  
  const cached = memoizee(fn, {
    promise: true,
    maxAge: ttl,
    max,
    preFetch: 0.5,
  });
  
  caches.set(name, cached);
  return cached as T;
}

export function invalidateCache(name: string): void {
  const cache = caches.get(name);
  if (cache) {
    cache.clear();
  }
}

export function invalidateAllCaches(): void {
  caches.forEach((cache) => {
    cache.clear();
  });
}

export function getCacheStats(): Record<string, { size: number }> {
  const stats: Record<string, { size: number }> = {};
  return stats;
}
