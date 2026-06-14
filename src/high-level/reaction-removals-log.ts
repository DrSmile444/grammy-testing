/**
 * A captured `deleteMessageReaction` / `deleteAllMessageReactions` API call, normalised for
 * test assertions.
 */
export interface ReactionRemoval {
  /** The removal method name (`deleteMessageReaction` or `deleteAllMessageReactions`). */
  method: string;
  /** The `chat_id` from the removal payload. */
  chatId: number | string;
  /**
   * The `message_id` from the removal payload. Present for `deleteMessageReaction`; `undefined`
   * for `deleteAllMessageReactions`, which removes all reactions by a user/chat (no message_id).
   */
  messageId: number | undefined;
  /** The original captured outgoing-API payload (escape hatch). */
  raw: Record<string, unknown>;
}

/**
 * Orchestrator-wide collection of `ReactionRemoval` records in capture order.
 * Returned by `chats.reactionRemovals`.
 */
export class ReactionRemovalsLog {
  private readonly items: ReactionRemoval[] = [];

  /**
   * Appends a captured reaction removal to the log.
   * @param removal - The reaction removal to append.
   */
  push(removal: ReactionRemoval): void {
    this.items.push(removal);
  }

  /**
   * Number of captured reaction removals in the log.
   * @returns The count of captured removals.
   */
  get length(): number {
    return this.items.length;
  }

  /**
   * The most recently captured reaction removal, or `undefined` if the log is empty.
   * @returns The last removal, or `undefined`.
   */
  get last(): ReactionRemoval | undefined {
    return this.items.at(-1);
  }

  /**
   * Read-only view of all captured reaction removals in dispatch order.
   * @returns A read-only array of all captured removals.
   */
  get all(): readonly ReactionRemoval[] {
    return this.items;
  }

  /**
   * Returns the last reaction removal or throws if the log is empty.
   * @returns The last `ReactionRemoval`.
   * @throws {Error} When the log is empty.
   */
  lastOrThrow(): ReactionRemoval {
    const last = this.items.at(-1);

    if (last === undefined) {
      throw new Error('Expected a reaction removal but the log is empty');
    }

    return last;
  }

  /** Removes all reaction removals from the log. */
  clear(): void {
    this.items.length = 0;
  }
}
