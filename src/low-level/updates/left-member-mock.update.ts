import type { Update } from 'grammy/types';

import { GenericMockUpdate } from './generic-mock.update';

/**
 * Service-message update for "user left the chat". Default left
 * member is {@link GenericMockUpdate.genericUser2}; default chat is
 * the supergroup fixture.
 */
export class LeftMemberMockUpdate extends GenericMockUpdate {
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
        left_chat_member: this.genericUser2,
      },
    };
  }

  build(): Update {
    return this.minimalUpdate as Update;
  }
}
