import type { Update } from 'grammy/types';

import { GenericMockUpdate } from './generic-mock.update';

/**
 * Service-message update for "user joined the chat". Default new
 * member is {@link GenericMockUpdate.genericUser2}; default chat is
 * the supergroup fixture.
 */
export class NewMemberMockUpdate extends GenericMockUpdate {
  minimalUpdate: Partial<Update>;

  /** Initialises the minimal `new_chat_members` update payload using the fixture defaults. */
  constructor() {
    super();

    this.minimalUpdate = {
      update_id: this.genericUpdateId,
      message: {
        message_id: 12_345,
        date: this.genericSentDate,
        from: this.genericUser2,
        chat: this.genericSuperGroup,
        new_chat_members: [this.genericUser2],
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
