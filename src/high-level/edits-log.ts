/**
 * A captured `editMessage*` API call, normalised for test assertions.
 */
export interface Edit {
  /** Edited text or caption, or `undefined` for media-only edits. */
  text: string | undefined;
  /** Synthetic message ID of the original reply that was edited. */
  editedMessageId: number;
  /** The original captured outgoing-API payload (escape hatch). */
  raw: Record<string, unknown>;
}

/**
 * Per-user collection of `Edit` records in capture order.
 * Returned by `chats.editsFor(user)`.
 */
export class EditsLog {
  private readonly items: Edit[] = [];

  /**
   * Appends a captured edit to the log.
   * @param edit - The edit to append.
   */
  push(edit: Edit): void {
    this.items.push(edit);
  }

  /**
   * Number of captured edits in the log.
   * @returns The count of captured edits.
   */
  get length(): number {
    return this.items.length;
  }

  /**
   * The most recently captured edit, or `undefined` if the log is empty.
   * @returns The last edit, or `undefined`.
   */
  get last(): Edit | undefined {
    return this.items.at(-1);
  }

  /**
   * Read-only view of all captured edits in dispatch order.
   * @returns A read-only array of all captured edits.
   */
  get all(): readonly Edit[] {
    return this.items;
  }

  /**
   * Returns the last edit or throws if the log is empty.
   * @returns The last `Edit`.
   * @throws {Error} When the log is empty.
   */
  lastOrThrow(): Edit {
    const last = this.items.at(-1);

    if (last === undefined) {
      throw new Error('Expected an edit but the edit log is empty');
    }

    return last;
  }

  /** Removes all edits from the log. */
  clear(): void {
    this.items.length = 0;
  }
}
