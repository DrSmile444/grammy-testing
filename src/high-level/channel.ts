import type { Bot, Context } from 'grammy';
import type { Chat, Message, ReactionCount, Update } from 'grammy/types';

import { type ChatRefHolder,setBotRef } from './chat';
import { makeChannelBotUser } from './dispatch';
import type { Group } from './group';
import type { MessagesLog } from './messages-log';
import type { Supergroup } from './supergroup';
import type { DispatchReactionCountOptions, Membership } from './types';

let postCounter = 1;
let editPostCounter = 1;
let reactionCountCounter = 1;

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

  /**
   * Dispatches an `edited_channel_post` update — simulating a channel post
   * being edited. `messageId` is the `message_id` of the original channel post.
   * @param messageId
   * @param newText
   * @param options
   */
  async editPost(
    messageId: number,
    newText: string,
    options: EditPostOptions = {},
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    const update: Update = {
      update_id: 1_600_000 + editPostCounter++,
      edited_channel_post: {
        message_id: messageId,
        date: options.date ?? now,
        edit_date: now,
        chat: this.toTelegramChat(),
        text: newText,
      },
    } as Update;

    await this.bot.handleUpdate(update);
  }

  /**
   * Dispatches a `message_reaction_count` update — aggregate anonymous
   * reactions on a message in this channel.
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

export interface EditPostOptions {
  /** Override the original `date` timestamp of the channel post. */
  date?: number;
}

// Re-export so callers can import from 'channel' directly if needed.
