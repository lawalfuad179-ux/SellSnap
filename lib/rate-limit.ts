import prisma from '@/lib/db';

export class RateLimiter {
  private limit: number;
  private windowMs: number;

  constructor({ limit = 5, windowMs = 60000 }: { limit?: number; windowMs?: number }) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.windowMs);

    // Clean up expired entries periodically
    await prisma.rateLimit.deleteMany({
      where: { key, expiresAt: { lt: now } },
    });

    // Count existing requests in the window
    const existing = await prisma.rateLimit.findFirst({
      where: { key, expiresAt: { gte: windowStart } },
      orderBy: { expiresAt: 'desc' },
    });

    if (!existing) {
      await prisma.rateLimit.create({
        data: {
          key,
          count: 1,
          expiresAt: new Date(now.getTime() + this.windowMs),
        },
      });
      return true;
    }

    if (existing.count >= this.limit) {
      return false;
    }

    await prisma.rateLimit.update({
      where: { id: existing.id },
      data: { count: existing.count + 1 },
    });

    return true;
  }
}

export const authRateLimiter = new RateLimiter({ limit: 5, windowMs: 60000 });
export const orderRateLimiter = new RateLimiter({ limit: 10, windowMs: 60000 });
