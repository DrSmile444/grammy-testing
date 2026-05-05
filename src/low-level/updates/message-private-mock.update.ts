import type { Update } from 'grammy/types';

import { GenericMockUpdate } from './generic-mock.update';

/**
 * Builds a private-chat text-message update. The bot under test will
 * see it as a DM from the {@link GenericMockUpdate.genericUser} fixture.
 */
export class MessagePrivateMockUpdate extends GenericMockUpdate {
  minimalUpdate: Partial<Update>;

  /**
   * Creates a private-chat message update with the given text.
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
        chat: this.genericPrivateChat,
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
