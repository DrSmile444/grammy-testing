import type { Bot, Context } from 'grammy';
import type { Chat, ReactionCount, Update, User as TelegramUser } from 'grammy/types';

import { type ChatRefHolder, setBotRef } from './chat';
import { dispatchChatMember, dispatchMyChatMember } from './dispatch';
import type { IdGenerator } from './id-generator';
import type { MessagesLog } from './messages-log';
import type {
  ChatMemberStatus,
  DispatchMemberUpdateOptions,
  DispatchReactionCountOptions,
  Membership,
  MemberStatusTransition,
  PromotePermissions,
  RestrictPermissions,
  SendSystemMessageOptions,
} from './types';
import type { User } from './user';

const FULL_ADMIN_RIGHTS = {
  is_anonymous: false,
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
  can_pin_messages: true,
  can_manage_topics: true,
} as const;

/**
 * Supergroup chat. Same semantics as `Group` for membership tracking,
 * but with a different `chat.type` discriminant.
 */
export class Supergroup<TContext extends Context = Context> implements ChatRefHolder<TContext> {
  readonly type = 'supergroup' as const;

  readonly members = new Map<number, Membership<TContext>>();

  /** @internal */
  messages!: MessagesLog<TContext>;

  /** @internal */
  bot!: Bot<TContext>;

  /**
   * Creates a `Supergroup` actor with the given ID and title.
   * @param id - Telegram chat ID (negative integer).
   * @param title - Display title of the supergroup.
   * @param ids - Shared ID generator for this `Chats` instance.
   */
  constructor(
    public readonly id: number,
    public readonly title: string,
    private readonly ids: IdGenerator,
  ) {}

  /**
   * Wires the grammY `Bot` instance so dispatch methods can call `handleUpdate`.
   * @param bot - The `Bot` instance to attach.
   */
  [setBotRef](bot: Bot<TContext>): void {
    this.bot = bot;
  }

  /**
   * Returns this supergroup as a Telegram `Chat.SupergroupChat` object.
   * @returns A plain `Chat.SupergroupChat` suitable for embedding in updates.
   */
  toTelegramChat(): Chat.SupergroupChat {
    return { id: this.id, type: 'supergroup', title: this.title };
  }

  /**
   * Grants `user` administrator rights in this supergroup, optionally customising individual permissions.
   * @param user - The user to promote.
   * @param permissions - Optional permission overrides; defaults to full admin rights.
   * @returns The new `Membership` record for `user`.
   */
  promote(user: User<TContext>, permissions: PromotePermissions = {}): Membership<TContext> {
    const membership: Membership<TContext> = {
      user,
      chat: this,
      status: 'administrator',
      permissions: { ...FULL_ADMIN_RIGHTS, ...permissions },
    };

    this.members.set(user.id, membership);

    return membership;
  }

  /**
   * Restricts `user` in this supergroup with the given permission set.
   * @param user - The user to restrict.
   * @param permissions - The restriction flags to apply.
   * @param untilDate - Optional Unix timestamp when the restriction expires.
   * @returns The new `Membership` record for `user`.
   */
  restrict(user: User<TContext>, permissions: RestrictPermissions = {}, untilDate?: number): Membership<TContext> {
    const membership: Membership<TContext> = {
      user,
      chat: this,
      status: 'restricted',
      permissions,
      untilDate,
    };

    this.members.set(user.id, membership);

    return membership;
  }

  /**
   * Designates `user` as the creator of this supergroup. Pure state write — no Telegram update is dispatched.
   * @param user - The user to set as creator.
   * @returns The new `Membership` record for `user`.
   */
  own(user: User<TContext>): Membership<TContext> {
    const membership: Membership<TContext> = {
      user,
      chat: this,
      status: 'creator',
      permissions: { is_anonymous: false },
    };

    this.members.set(user.id, membership);

    return membership;
  }

  /**
   * Adds `user` as a plain member of this supergroup. Pure state write — no Telegram update is dispatched.
   * @param user - The user to add as a member.
   * @returns The new `Membership` record for `user`.
   */
  join(user: User<TContext>): Membership<TContext> {
    const membership: Membership<TContext> = {
      user,
      chat: this,
      status: 'member',
      permissions: {},
    };

    this.members.set(user.id, membership);

    return membership;
  }

  /**
   * Dispatches a `my_chat_member` update and updates the in-memory bot membership record.
   * @param user - The actor who triggered the membership change (populates `from`).
   * @param transition - The status transition to apply to the bot.
   */
  async changeMemberStatus(user: User<TContext>, transition: MemberStatusTransition): Promise<void> {
    const botUser = this.bot.botInfo as TelegramUser;
    const current = this.members.get(botUser.id);
    const fromStatus = transition.from ?? current?.status ?? 'left';

    await dispatchMyChatMember(this.bot, {
      chat: this.toTelegramChat(),
      user,
      botUser,
      fromStatus,
      toStatus: transition.to,
      permissions: transition.permissions ?? {},
      untilDate: transition.untilDate,
      updateId: this.ids.nextUpdateId(),
    });

    this.members.set(botUser.id, {
      user: botUser as unknown as User<TContext>,
      chat: this,
      status: transition.to,
      permissions: transition.permissions ?? {},
      untilDate: transition.untilDate,
    });
  }

  /**
   * Dispatches a `chat_member` update — an admin changing another user's
   * membership status in this supergroup. This is distinct from `my_chat_member`
   * (which tracks the bot's own status).
   *
   * `old_chat_member` defaults to `{ status: 'member' }` and can be
   * overridden via `options.oldStatus`.
   * @param fromAdmin - The admin user performing the status change.
   * @param targetUser - The user whose status is being changed.
   * @param newStatus - The new membership status to assign.
   * @param options - Optional overrides such as `oldStatus` and `permissions`.
   */
  async dispatchMemberUpdate(
    fromAdmin: User<TContext>,
    targetUser: User<TContext>,
    newStatus: ChatMemberStatus,
    options: DispatchMemberUpdateOptions = {},
  ): Promise<void> {
    await dispatchChatMember({
      bot: this.bot,
      chat: this.toTelegramChat(),
      fromAdmin,
      targetUser,
      newStatus,
      oldStatus: options.oldStatus,
      permissions: options.permissions,
      updateId: this.ids.nextUpdateId(),
    });
  }

  /**
   * Dispatches a `message_reaction_count` update — aggregate anonymous
   * reactions on a message in this supergroup.
   * @param messageId - The `message_id` of the message that received reactions.
   * @param reactions - Array of `ReactionCount` objects describing reaction totals.
   * @param options - Optional overrides for the update timestamp.
   */
  async dispatchReactionCount(messageId: number, reactions: ReactionCount[], options: DispatchReactionCountOptions = {}): Promise<void> {
    await this.bot.handleUpdate({
      update_id: this.ids.nextUpdateId(),
      message_reaction_count: {
        chat: this.toTelegramChat(),
        message_id: messageId,
        date: options.date ?? Math.floor(Date.now() / 1000),
        reactions,
      },
    } as Update);
  }

  /**
   * Dispatches a `message` update with no `from` field, simulating a Telegram system or
   * service message that carries no sender identity. Bots guard against this with
   * `if (!ctx.from) return next()` — this verb makes that branch testable without raw
   * `handleUpdate` calls.
   * @param text - The message text.
   * @param options - Optional `messageId` override; auto-generated when omitted.
   */
  async sendSystemMessage(text: string, options: SendSystemMessageOptions = {}): Promise<void> {
    await this.bot.handleUpdate({
      update_id: this.ids.nextUpdateId(),
      message: {
        message_id: options.messageId ?? this.ids.nextMessageId(),
        date: Math.floor(Date.now() / 1000),
        chat: this.toTelegramChat(),
        text,
      },
    } as Update);
  }
}
