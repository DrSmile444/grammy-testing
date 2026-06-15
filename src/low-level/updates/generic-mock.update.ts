import deepmergeImport from 'deepmerge';
import type { Chat, ChatMemberAdministrator, ChatMemberMember, ChatMemberOwner, Message, Update, User, UserFromGetMe } from 'grammy/types';
import type { PartialDeep } from 'type-fest';

// deepmerge@4 ships a CJS-only bundle; some bundlers (tsup ESM output) wrap it in { default: fn }.
// The fallback ?? deepmergeImport handles both the direct-function and the wrapped-default shapes.
const deepmerge = (deepmergeImport as unknown as { default?: typeof deepmergeImport }).default ?? deepmergeImport;

/**
 * Recursive partial helper for `Update` deep-merging in
 * {@link GenericMockUpdate.buildOverwrite}. Loose by design — exotic
 * Telegram payloads should be allowed without compile-time friction.
 */
export type PartialUpdate<U extends Update = Update> = PartialDeep<U>;

/**
 * Abstract base for every concrete mock update builder. Exposes the
 * generic fixtures (users, chats, members) that subclasses compose
 * into their canonical update, and declares the `.build()` /
 * `.buildOverwrite()` contract.
 *
 * Deep-merge semantics on `.buildOverwrite()`:
 * - nested objects merge recursively
 * - arrays REPLACE (do not concatenate)
 * - primitives REPLACE
 *
 * Reachable only via `@grammyjs/testing/low-level` — not the default
 * package entry — to signal escape-hatch status.
 */
export abstract class GenericMockUpdate {
  readonly genericUpdateId = 10_000;

  readonly genericSentDate = Math.floor(Date.now() / 1000);

  readonly genericSuperGroup: Chat.SupergroupChat = {
    type: 'supergroup',
    id: 202_212,
    title: 'GrammyMock',
  };

  readonly genericChannelChat: Chat.ChannelChat = {
    type: 'channel',
    id: 202_213,
    title: 'GrammyMockChannel',
  };

  readonly genericGroupChat: Chat.GroupChat = {
    type: 'group',
    id: 303_303,
    title: 'GrammyMockGroup',
  };

  readonly genericUserBot: UserFromGetMe = {
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

  readonly genericUserAtom = {
    id: 1_111_111,
    last_name: 'GrammyMock LastName',
    first_name: 'GrammyMock FirstName',
    username: 'GrammyMock_Username',
  };

  readonly genericUser2Atom = {
    id: 1_111_112,
    last_name: 'GrammyMock LastName2',
    first_name: 'GrammyMock FirstName2',
    username: 'GrammyMock_Username2',
  };

  readonly genericUser: User = {
    ...this.genericUserAtom,
    is_bot: false,
  };

  readonly genericUser2: User = {
    ...this.genericUser2Atom,
    is_bot: false,
  };

  readonly genericPrivateChat: Chat.PrivateChat = {
    type: 'private',
    id: this.genericUserAtom.id,
    first_name: this.genericUserAtom.first_name,
    last_name: this.genericUserAtom.last_name,
    username: this.genericUserAtom.username,
  };

  readonly genericOwner: ChatMemberOwner = {
    status: 'creator',
    user: this.genericUser,
    custom_title: 'Super Creator Title',
    is_anonymous: false,
  };

  readonly genericAdmin: ChatMemberAdministrator = {
    status: 'administrator',
    user: this.genericUser2,
    custom_title: 'Super Admin Title',
    is_anonymous: true,
    can_be_edited: true,
    can_change_info: true,
    can_delete_messages: true,
    can_edit_messages: true,
    can_invite_users: true,
    can_manage_chat: true,
    can_manage_video_chats: true,
    can_promote_members: true,
    can_restrict_members: true,
    can_post_stories: true,
    can_edit_stories: true,
    can_delete_stories: true,
  };

  readonly genericUserMember: ChatMemberMember = {
    status: 'member',
    user: this.genericUser,
  };

  /**
   * Canonical `message` fields shared by every text-message-shaped
   * update. Subclasses spread this into their `minimalUpdate`.
   */
  readonly genericMessagePartial: Partial<Message> = {
    message_id: 12_345,
    date: this.genericSentDate,
    chat: this.genericGroupChat,
    from: this.genericUser,
  };

  /**
   * Canonical, type-correct minimal update for this builder's update
   * kind. Subclasses define this and combine with `.build()`.
   */
  abstract minimalUpdate: Partial<Update>;

  /**
   * Build the canonical update for this builder.
   */
  abstract build(): Update;

  /**
   * Deep-merge `partial` into the canonical update and return the
   * result. See class JSDoc for merge semantics.
   * @param partial - Partial-update overrides.
   * @returns Merged `Update`.
   */
  buildOverwrite(partial: PartialUpdate): Update {
    return deepmerge(this.build(), partial as Partial<Update>, {
      arrayMerge: (_destination, source: unknown[]) => source,
    });
  }

  /**
   * Pass-through that types a partial update value strictly.
   * @param update - Partial update to type-narrow.
   * @returns The same value with its inferred type preserved.
   */
  static getValidUpdate<U extends PartialUpdate>(update: U): U {
    return update;
  }
}
