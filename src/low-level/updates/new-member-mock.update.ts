import type { Update } from 'grammy/types';

import { GenericMockUpdate } from './generic-mock.update';

/**
 * Service-message update for "user joined the chat". Default new
 * member is {@link GenericMockUpdate.genericUser2}; default chat is
 * the supergroup fixture.
 */
export class NewMemberMockUpdate extends GenericMockUpdate {
  minimalUpdate: Partial<Update>;

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

  build(): Update {
    return this.minimalUpdate as Update;
  }
}
