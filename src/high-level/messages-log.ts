import type { Context } from 'grammy';

import type { Reply } from './reply';

/**
 * Per-chat or per-user collection of `Reply` objects in capture
 * order. Exposes `.last`, `.byText`, plus the underlying array.
 */
export class MessagesLog<TContext extends Context = Context> {
  private readonly items: Reply<TContext>[] = [];

  /**
   * Appends a reply to the log.
   * @param reply - The reply to append.
   */
  push(reply: Reply<TContext>): void {
    this.items.push(reply);
  }

  /**
   * Number of captured replies in the log.
   * @returns The count of captured replies.
   */
  get length(): number {
    return this.items.length;
  }

  /**
   * The most recently captured reply, or `undefined` if the log is empty.
   * @returns The last reply, or `undefined`.
   */
  get last(): Reply<TContext> | undefined {
    return this.items.at(-1);
  }

  /**
   * Read-only view of all captured replies in dispatch order.
   * @returns A read-only array of all captured replies.
   */
  get all(): readonly Reply<TContext>[] {
    return this.items;
  }

  /**
   * Returns the first reply whose text matches `matcher`, or `undefined` if none match.
   * @param matcher - A string for exact match or a `RegExp` for pattern match.
   * @returns The first matching reply, or `undefined`.
   */
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

  /** Removes all replies from the log. */
  clear(): void {
    this.items.length = 0;
  }
}
