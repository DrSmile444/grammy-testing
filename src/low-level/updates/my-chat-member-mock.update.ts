import type { Update } from 'grammy/types';

import { GenericMockUpdate } from './generic-mock.update';

/**
 * `my_chat_member` update describing a transition of the bot's own
 * membership status in a chat. Default transition: bot is a regular
 * member transitioning to administrator in the supergroup fixture.
 */
export class MyChatMemberMockUpdate extends GenericMockUpdate {
  minimalUpdate: Partial<Update>;

  constructor() {
    super();

    this.minimalUpdate = {
      update_id: this.genericUpdateId,
      my_chat_member: {
        chat: this.genericSuperGroup,
        from: this.genericUser2,
        date: this.genericSentDate,
        old_chat_member: {
          status: 'member',
          user: this.genericUserBot,
        },
        new_chat_member: {
          status: 'administrator',
          user: this.genericUserBot,
          can_be_edited: false,
          is_anonymous: false,
          can_manage_chat: true,
          can_change_info: false,
          can_delete_messages: true,
          can_invite_users: true,
          can_restrict_members: true,
          can_pin_messages: true,
          can_promote_members: false,
          can_manage_video_chats: false,
          can_post_stories: false,
          can_edit_stories: false,
          can_delete_stories: false,
          can_manage_topics: false,
        },
      },
    };
  }

  build(): Update {
    return this.minimalUpdate as Update;
  }
}
