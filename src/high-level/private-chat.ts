import type { Bot, Context } from 'grammy';
import type { Chat } from 'grammy/types';

import { type ChatRefHolder,setBotRef } from './chat';
import type { User } from './user';

/**
 * Private chat between the bot and a single user. `id` matches the
 * user's id (Telegram convention).
 */
export class PrivateChat<TContext extends Context = Context>
  implements ChatRefHolder<TContext>
{
  readonly type = 'private' as const;

  readonly id: number;

  readonly first_name: string;

  readonly last_name?: string;

  readonly username?: string;

  /** @internal */
  bot!: Bot<TContext>;

  constructor(public readonly user: User<TContext>) {
    this.id = user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.username = user.username;
  }

  [setBotRef](bot: Bot<TContext>): void {
    this.bot = bot;
  }

  toTelegramChat(): Chat.PrivateChat {
    return {
      id: this.id,
      type: 'private',
      first_name: this.first_name,
      last_name: this.last_name,
      username: this.username,
    };
  }
}
