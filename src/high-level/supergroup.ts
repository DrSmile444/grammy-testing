import type { Bot, Context } from 'grammy';
import type { Chat } from 'grammy/types';

import { type ChatRefHolder,setBotRef } from './chat';
import { dispatchMyChatMember } from './dispatch';
import type { MessagesLog } from './messages-log';
import type {
  Membership,
  MemberStatusTransition,
  PromotePermissions,
  RestrictPermissions,
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
export class Supergroup<TContext extends Context = Context>
  implements ChatRefHolder<TContext>
{
  readonly type = 'supergroup' as const;

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

  toTelegramChat(): Chat.SupergroupChat {
    return { id: this.id, type: 'supergroup', title: this.title };
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
}
