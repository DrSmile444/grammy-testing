/**
 * Per-user collection of `sendChatAction` action strings in capture order.
 * Returned by `chats.actionsFor(user)`.
 */
export class ActionsLog {
  private readonly items: string[] = [];

  /**
   * Appends a captured action to the log.
   * @param action - The action string (e.g. `'typing'`).
   */
  push(action: string): void {
    this.items.push(action);
  }

  /**
   * Number of captured actions in the log.
   * @returns The count of captured actions.
   */
  get length(): number {
    return this.items.length;
  }

  /**
   * The most recently captured action, or `undefined` if the log is empty.
   * @returns The last action string, or `undefined`.
   */
  get last(): string | undefined {
    return this.items.at(-1);
  }

  /**
   * Read-only view of all captured actions in dispatch order.
   * @returns A read-only array of all captured action strings.
   */
  get all(): readonly string[] {
    return this.items;
  }

  /** Removes all actions from the log. */
  clear(): void {
    this.items.length = 0;
  }
}
