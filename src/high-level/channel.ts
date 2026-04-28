 

import type { Bot, Context } from 'grammy';
import type { Chat, Message, Update } from 'grammy/types';

import { type ChatRefHolder,setBotRef } from './chat';
import { makeChannelBotUser } from './dispatch';
import type { Group } from './group';
import type { MessagesLog } from './messages-log';
import type { Supergroup } from './supergroup';
import type { Membership } from './types';

let postCounter = 1;

/**
 * Channel actor. The only verb in v0.2 is `postMessageTo` which
 * dispatches a message to a target group with `sender_chat = this`.
 * Channel-self-posting (Coverage-audit gap #6) defers to v0.2.x.
 */
export class Channel<TContext extends Context = Context>
  implements ChatRefHolder<TContext>
{
  readonly type = 'channel' as const;

  /** @internal — assigned by Chats after construction. */
  messages!: MessagesLog<TContext>;

  /**
   * Channel members (subscribers + admins). Tracked for membership-roles
   * spec parity with Group/Supergroup; populated only when a test
   * explicitly promotes/restricts a user in the channel.
   */
  readonly members = new Map<number, Membership<TContext>>();

  /** @internal */
  bot!: Bot<TContext>;

  constructor(
    public readonly id: number,
    public readonly title: string,
  ) {}

  [setBotRef](bot: Bot<TContext>): void {
    this.bot = bot;
  }

  toTelegramChat(): Chat.ChannelChat {
    return { id: this.id, type: 'channel', title: this.title };
  }

  async postMessageTo<TC extends Context = TContext>(
    target: Group<TC> | Supergroup<TC>,
    text: string,
    options: { messageId?: number } = {},
  ): Promise<void> {
    const messageId = options.messageId ?? 5_000_000 + postCounter++;

    const message: Message = {
      message_id: messageId,
      date: Math.floor(Date.now() / 1000),
      chat: target.toTelegramChat(),
      from: makeChannelBotUser(),
      sender_chat: this.toTelegramChat(),
      text,
    } as Message;

    const update: Update = {
      update_id: 300_000 + postCounter,
      message,
    } as Update;

    await this.bot.handleUpdate(update);
  }
}
