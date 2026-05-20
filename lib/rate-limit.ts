export class RateLimiter {
  private cache = new Map<string, { count: number; lastReset: number }>();
  private limit: number;
  private windowMs: number;

  constructor({ limit = 5, windowMs = 60000 }: { limit?: number; windowMs?: number }) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(ip: string): boolean {
    const now = Date.now();
    const record = this.cache.get(ip);

    if (!record) {
      this.cache.set(ip, { count: 1, lastReset: now });
      return true;
    }

    if (now - record.lastReset > this.windowMs) {
      this.cache.set(ip, { count: 1, lastReset: now });
      return true;
    }

    if (record.count >= this.limit) {
      return false;
    }

    record.count += 1;
    return true;
  }
}

export const authRateLimiter = new RateLimiter({ limit: 5, windowMs: 60000 }); // 5 requests per minute
export const orderRateLimiter = new RateLimiter({ limit: 10, windowMs: 60000 }); // 10 requests per minute
