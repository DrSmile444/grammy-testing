import type { Update } from 'grammy/types';

import { GenericMockUpdate } from './generic-mock.update';

/**
 * Builds a supergroup text-message update. Default chat is the
 * {@link GenericMockUpdate.genericSuperGroup} fixture; default sender
 * is {@link GenericMockUpdate.genericUser}.
 */
export class MessageMockUpdate extends GenericMockUpdate {
  minimalUpdate: Partial<Update>;

  /**
   * Creates a supergroup message update with the given text.
   * @param text - The message text to embed in the update.
   */
  constructor(text: string) {
    super();

    this.minimalUpdate = {
      update_id: this.genericUpdateId,
      message: {
        message_id: 12_345,
        date: this.genericSentDate,
        from: this.genericUser,
        chat: this.genericSuperGroup,
        text,
      },
    };
  }

  /**
   * Returns the assembled update cast to a full `Update` object.
   * @returns The assembled `Update`.
   */
  build(): Update {
    return this.minimalUpdate as Update;
  }
}
