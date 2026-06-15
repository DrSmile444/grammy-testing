/**
 * A captured `sendMessageDraft` / `sendRichMessageDraft` API call, normalised for test
 * assertions. Draft sends return `true` (not a `Message`), so they are tracked here rather than
 * in `chat.messages` / `user.replies`.
 */
export interface DraftEntry {
  /** The draft-sending method name (`sendMessageDraft` or `sendRichMessageDraft`). */
  method: string;
  /** The `chat_id` from the draft payload (a private chat). */
  chatId: number;
  /** The original captured outgoing-API payload (escape hatch). */
  payload: Record<string, unknown>;
}

/**
 * Per-user collection of `DraftEntry` records in capture order.
 * Returned by `chats.draftsFor(user)` and `user.drafts`.
 */
export class DraftsLog {
  private readonly items: DraftEntry[] = [];

  /**
   * Appends a captured draft to the log.
   * @param entry - The draft entry to append.
   */
  push(entry: DraftEntry): void {
    this.items.push(entry);
  }

  /**
   * Number of captured drafts in the log.
   * @returns The count of captured drafts.
   */
  get length(): number {
    return this.items.length;
  }

  /**
   * The most recently captured draft, or `undefined` if the log is empty.
   * @returns The last draft, or `undefined`.
   */
  get last(): DraftEntry | undefined {
    return this.items.at(-1);
  }

  /**
   * Read-only view of all captured drafts in dispatch order.
   * @returns A read-only array of all captured drafts.
   */
  get all(): readonly DraftEntry[] {
    return this.items;
  }

  /**
   * Returns the last draft or throws if the log is empty.
   * @returns The last `DraftEntry`.
   * @throws {Error} When the log is empty.
   */
  lastOrThrow(): DraftEntry {
    const last = this.items.at(-1);

    if (last === undefined) {
      throw new Error('Expected a draft but the draft log is empty');
    }

    return last;
  }

  /** Removes all drafts from the log. */
  clear(): void {
    this.items.length = 0;
  }
}
