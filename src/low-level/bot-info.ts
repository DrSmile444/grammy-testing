import type { UserFromGetMe } from 'grammy/types';

/**
 * Default `botInfo` value the testing harness pre-populates on the
 * bot under test. Setting this BEFORE `bot.init()` causes grammY to
 * skip the `getMe` round-trip — keeping `chats.outgoing.requests`
 * empty after setup.
 */
export const genericBotInfo: UserFromGetMe = {
  id: 2022,
  is_bot: true,
  first_name: 'GrammyMock BotFirstName',
  last_name: 'GrammyMock BotLastName',
  username: 'GrammyMock_bot',
  can_join_groups: true,
  can_read_all_group_messages: true,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
  can_manage_bots: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  supports_join_request_queries: false,
};
