import type { Bot, Context } from 'grammy';
import type { Chat, ReactionCount, Update } from 'grammy/types';

import { type ChatRefHolder,setBotRef } from './chat';
import { dispatchChatMember, dispatchMyChatMember } from './dispatch';
import type { MessagesLog } from './messages-log';
import type {
  ChatMemberStatus,
  DispatchMemberUpdateOptions,
  DispatchReactionCountOptions,
  Membership,
  MemberStatusTransition,
  PromotePermissions,
  RestrictPermissions,
} from './types';
import type { User } from './user';

let reactionCountCounter = 1;

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
 * Regular (non-supergroup) chat. Membership is tracked on a per-user
 * basis via `promote` / `restrict` / `changeMemberStatus`.
 */
export class Group<TContext extends Context = Context>
  implements ChatRefHolder<TContext>
{
  readonly type = 'group' as const;

  readonly members = new Map<number, Membership<TContext>>();

  /** @internal — assigned by Chats after construction. */
  messages!: MessagesLog<TContext>;

  /** @internal */
  bot!: Bot<TContext>;

  constructor(
    public readonly id: number,
    public readonly title: string,
  ) {}

  [setBotRef](bot: Bot<TContext>): void {
    this.bot = bot;
  }

  toTelegramChat(): Chat.GroupChat {
    return { id: this.id, type: 'group', title: this.title };
  }

  promote(
    user: User<TContext>,
    permissions: PromotePermissions = {},
  ): Membership<TContext> {
    const membership: Membership<TContext> = {
      user,
      chat: this,
      status: 'administrator',
      permissions: { ...FULL_ADMIN_RIGHTS, ...permissions },
    };

    this.members.set(user.id, membership);

    return membership;
  }

  restrict(
    user: User<TContext>,
    permissions: RestrictPermissions = {},
    untilDate?: number,
  ): Membership<TContext> {
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

  async changeMemberStatus(
    user: User<TContext>,
    transition: MemberStatusTransition,
  ): Promise<void> {
    const current = this.members.get(user.id);
    const fromStatus = transition.from ?? current?.status ?? 'left';

    await dispatchMyChatMember(this.bot, {
      chat: this.toTelegramChat(),
      user,
      fromStatus,
      toStatus: transition.to,
      permissions: transition.permissions ?? {},
      untilDate: transition.untilDate,
    });

    this.members.set(user.id, {
      user,
      chat: this,
      status: transition.to,
      permissions: transition.permissions ?? {},
      untilDate: transition.untilDate,
    });
  }

  /**
   * Dispatches a `chat_member` update — an admin changing another user's
   * membership status in this group. This is distinct from `my_chat_member`
   * (which tracks the bot's own status).
   *
   * `old_chat_member` defaults to `{ status: 'member' }` and can be
   * overridden via `options.oldStatus`.
   * @param fromAdmin
   * @param targetUser
   * @param newStatus
   * @param options
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
    });
  }

  /**
   * Dispatches a `message_reaction_count` update — aggregate anonymous
   * reactions on a message in this group.
   * @param messageId
   * @param reactions
   * @param options
   */
  async dispatchReactionCount(
    messageId: number,
    reactions: ReactionCount[],
    options: DispatchReactionCountOptions = {},
  ): Promise<void> {
    await this.bot.handleUpdate({
      update_id: 1_760_000 + reactionCountCounter++,
      message_reaction_count: {
        chat: this.toTelegramChat(),
        message_id: messageId,
        date: options.date ?? Math.floor(Date.now() / 1000),
        reactions,
      },
    } as Update);
  }
}
