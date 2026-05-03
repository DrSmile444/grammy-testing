import type { Context, NextFunction } from 'grammy';

export interface RateLimitState {
  lastMessageAt: number;
  cooldownMs: number;
}

/**
 * Creates rate-limit middleware that throttles messages per user.
 * @param cooldownMs - Minimum ms between accepted messages from the same user.
 * @returns A grammY middleware function.
 */
export function createRateLimitMiddleware(cooldownMs: number) {
  const lastSeen = new Map<number, number>();

  return async (ctx: Context, next: NextFunction) => {
    const userId = ctx.from?.id;

    if (userId === undefined) {
      await next();

      return;
    }

    const now = Date.now();
    const lastAt = lastSeen.get(userId) ?? 0;

    if (now - lastAt < cooldownMs) {
      await ctx.reply('Slow down! Please wait before sending another message.');

      return;
    }

    lastSeen.set(userId, now);
    await next();
  };
}
