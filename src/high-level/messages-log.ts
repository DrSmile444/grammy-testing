import type { Context } from 'grammy';

import type { Reply } from './reply';

/**
 * Per-chat or per-user collection of `Reply` objects in capture
 * order. Exposes `.last`, `.byText`, plus the underlying array.
 */
export class MessagesLog<TContext extends Context = Context> {
  private readonly items: Reply<TContext>[] = [];

  push(reply: Reply<TContext>): void {
    this.items.push(reply);
  }

  get length(): number {
    return this.items.length;
  }

  get last(): Reply<TContext> | undefined {
    return this.items.at(-1);
  }

  get all(): readonly Reply<TContext>[] {
    return this.items;
  }

  byText(matcher: RegExp | string): Reply<TContext> | undefined {
    return this.items.find((reply) => {
      if (reply.text === undefined) {
        return false;
      }

      if (typeof matcher === 'string') {
        return reply.text === matcher;
      }

      return matcher.test(reply.text);
    });
  }

  clear(): void {
    this.items.length = 0;
  }
}
