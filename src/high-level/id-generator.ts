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
    const id = this.userCounter;

    this.userCounter += 1;

    return id;
  }

  nextGroupId(): number {
    const id = this.groupCounter;

    this.groupCounter -= 1;

    return id;
  }

  nextSupergroupId(): number {
    const id = this.supergroupCounter;

    this.supergroupCounter -= 1;

    return id;
  }

  nextChannelId(): number {
    const id = this.channelCounter;

    this.channelCounter -= 1;

    return id;
  }

  nextMessageId(): number {
    const id = this.messageCounter;

    this.messageCounter += 1;

    return id;
  }

  nextMediaGroupId(): string {
    const id = this.mediaGroupCounter;

    this.mediaGroupCounter += 1;

    return `mg-${String(id)}`;
  }

  nextFileId(): string {
    const id = this.fileCounter;

    this.fileCounter += 1;

    return `stub-file-${String(id)}`;
  }
}
