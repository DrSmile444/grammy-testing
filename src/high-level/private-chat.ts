import type { Bot, Context } from 'grammy';
import type { Chat } from 'grammy/types';

import { type ChatRefHolder, setBotRef } from './chat';
import { MessagesLog } from './messages-log';
import type { User } from './user';

/**
 * Private chat between the bot and a single user. `id` matches the
 * user's id (Telegram convention).
 */
export class PrivateChat<TContext extends Context = Context> implements ChatRefHolder<TContext> {
  readonly type = 'private' as const;

  readonly id: number;

  readonly first_name: string;

  readonly last_name?: string;

  readonly username?: string;

  messages: MessagesLog<TContext>;

  /** @internal */
  bot!: Bot<TContext>;

  /**
   * Creates a `PrivateChat` with ID and name mirrored from `user`.
   * @param user - The user that owns this private chat.
   */
  constructor(public readonly user: User<TContext>) {
    this.id = user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.username = user.username;
    this.messages = new MessagesLog<TContext>();
  }

  /**
   * Wires the grammY `Bot` instance so dispatch methods can call `handleUpdate`.
   * @param bot - The `Bot` instance to attach.
   */
  [setBotRef](bot: Bot<TContext>): void {
    this.bot = bot;
  }

  /**
   * Returns this private chat as a Telegram `Chat.PrivateChat` object.
   * @returns A plain `Chat.PrivateChat` suitable for embedding in updates.
   */
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
