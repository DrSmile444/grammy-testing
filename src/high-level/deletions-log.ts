import type { Context } from 'grammy';

import type { Reply } from './reply';

/**
 * A captured `deleteMessage` API call, normalised for test assertions.
 */
export interface Deletion<TContext extends Context = Context> {
  /** The `message_id` from the `deleteMessage` payload. */
  messageId: number;
  /** The original captured `Reply` if the message was sent during this test, otherwise `undefined`. */
  reply: Reply<TContext> | undefined;
  /** The original captured outgoing-API payload (escape hatch). */
  raw: Record<string, unknown>;
}

/**
 * Per-chat collection of `Deletion` records in capture order.
 * Returned by `chats.deletionsFor(chat)`.
 */
export class DeletionsLog<TContext extends Context = Context> {
  private readonly items: Deletion<TContext>[] = [];

  /**
   * Appends a captured deletion to the log.
   * @param deletion - The deletion to append.
   */
  push(deletion: Deletion<TContext>): void {
    this.items.push(deletion);
  }

  /**
   * Number of captured deletions in the log.
   * @returns The count of captured deletions.
   */
  get length(): number {
    return this.items.length;
  }

  /**
   * The most recently captured deletion, or `undefined` if the log is empty.
   * @returns The last deletion, or `undefined`.
   */
  get last(): Deletion<TContext> | undefined {
    return this.items.at(-1);
  }

  /**
   * Read-only view of all captured deletions in dispatch order.
   * @returns A read-only array of all captured deletions.
   */
  get all(): readonly Deletion<TContext>[] {
    return this.items;
  }

  /**
   * Returns the last deletion or throws if the log is empty.
   * @returns The last `Deletion<TContext>`.
   * @throws {Error} When the log is empty.
   */
  lastOrThrow(): Deletion<TContext> {
    const last = this.items.at(-1);

    if (last === undefined) {
      throw new Error('Expected a deletion but the deletion log is empty');
    }

    return last;
  }

  /** Removes all deletions from the log. */
  clear(): void {
    this.items.length = 0;
  }
}
