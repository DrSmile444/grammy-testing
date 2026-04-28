 

/**
 * Monotonic id generator scoped to a single {@link Chats} instance.
 * Different ranges per kind keep test debugging readable
 * (a 100M-range id is a user; -1B-range is a group, etc.).
 */
export class IdGenerator {
  private userCounter = 100_000_000;

  private groupCounter = -1_000_000_000;

  private supergroupCounter = -1_001_000_000_000;

  private channelCounter = -1_002_000_000_000;

  private messageCounter = 1;

  private mediaGroupCounter = 1;

  private fileCounter = 1;

  nextUserId(): number {
    return this.userCounter++;
  }

  nextGroupId(): number {
    return this.groupCounter--;
  }

  nextSupergroupId(): number {
    return this.supergroupCounter--;
  }

  nextChannelId(): number {
    return this.channelCounter--;
  }

  nextMessageId(): number {
    return this.messageCounter++;
  }

  nextMediaGroupId(): string {
    return `mg-${this.mediaGroupCounter++}`;
  }

  nextFileId(): string {
    return `stub-file-${this.fileCounter++}`;
  }
}
