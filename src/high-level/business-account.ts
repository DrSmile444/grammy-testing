import type { Bot, Context } from 'grammy';
import type { Message, Update } from 'grammy/types';

import type { IdGenerator } from './id-generator';
import type { User } from './user';

interface BusinessAccountContext<TContext extends Context> {
  bot: Bot<TContext>;
  ids: IdGenerator;
}

export interface ConnectOptions {
  /** Override the `date` timestamp of the connection event. */
  date?: number;
}

export interface BusinessSendMessageOptions {
  /** Override the `date` timestamp of the business message. */
  date?: number;
}

export interface BusinessEditMessageOptions {
  /** Override the `date` timestamp of the edited message. */
  date?: number;
}

export interface BusinessDeleteMessagesOptions {
  /** Override the private chat id (defaults to `businessAccount.user.id`). */
  chatId?: number;
}

/**
 * High-level actor for Telegram Business API updates. Minted by
 * `chats.newBusinessAccount(user)`. All Business API update types
 * (`business_connection`, `business_message`, `edited_business_message`,
 * `deleted_business_messages`) are dispatched through this actor.
 */
export class BusinessAccount<TContext extends Context = Context> {
  /** Unique business connection identifier, generated as `biz-<n>`. */
  readonly connectionId: string;

  /**
   * Creates a `BusinessAccount` actor wired to `user` with the given connection ID.
   * @param user - The `User` actor that owns this business account.
   * @param connectionId - The auto-generated business connection identifier.
   * @param ctx - Internal dependencies (bot, ids) provided by `Chats`.
   */
  constructor(
    /** The `User` actor that owns this business account. */
    public readonly user: User<TContext>,
    connectionId: string,
    private readonly ctx: BusinessAccountContext<TContext>,
  ) {
    this.connectionId = connectionId;
  }

  /**
   * Dispatches a `business_connection` update with `is_enabled: true`.
   * @param options - Optional overrides for the connection timestamp.
   */
  async connect(options: ConnectOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextUpdateId(),
      business_connection: {
        id: this.connectionId,
        user: {
          id: this.user.id,
          is_bot: false,
          first_name: this.user.first_name,
          last_name: this.user.last_name,
          username: this.user.username,
        },
        user_chat_id: this.user.id,
        date: options.date ?? Math.floor(Date.now() / 1000),
        is_enabled: true,
      },
    } as Update);
  }

  /**
   * Dispatches a `business_connection` update with `is_enabled: false`.
   * @param options - Optional overrides for the disconnection timestamp.
   */
  async disconnect(options: ConnectOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextUpdateId(),
      business_connection: {
        id: this.connectionId,
        user: {
          id: this.user.id,
          is_bot: false,
          first_name: this.user.first_name,
          last_name: this.user.last_name,
          username: this.user.username,
        },
        user_chat_id: this.user.id,
        date: options.date ?? Math.floor(Date.now() / 1000),
        is_enabled: false,
      },
    } as Update);
  }

  /**
   * Dispatches a `business_message` update. The message is a private chat
   * message from the business account owner, with `business_connection_id` set.
   * @param text - The message text to send.
   * @param options - Optional overrides for the message timestamp.
   */
  async sendMessage(text: string, options: BusinessSendMessageOptions = {}): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: options.date ?? now,
      chat: { id: this.user.id, type: 'private' as const, first_name: this.user.first_name },
      from: {
        id: this.user.id,
        is_bot: false,
        first_name: this.user.first_name,
        last_name: this.user.last_name,
        username: this.user.username,
      },
      text,
      business_connection_id: this.connectionId,
    } as Message;

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextUpdateId(),
      business_message: message,
    } as Update);
  }

  /**
   * Dispatches an `edited_business_message` update for the given message ID.
   * @param messageId - The `message_id` of the message to edit.
   * @param newText - The replacement text for the message.
   * @param options - Optional overrides for the original message timestamp.
   */
  async editMessage(messageId: number, newText: string, options: BusinessEditMessageOptions = {}): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    const message: Message = {
      message_id: messageId,
      date: options.date ?? now,
      edit_date: now,
      chat: { id: this.user.id, type: 'private' as const, first_name: this.user.first_name },
      from: {
        id: this.user.id,
        is_bot: false,
        first_name: this.user.first_name,
        last_name: this.user.last_name,
        username: this.user.username,
      },
      text: newText,
      business_connection_id: this.connectionId,
    } as Message;

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextUpdateId(),
      edited_business_message: message,
    } as Update);
  }

  /**
   * Dispatches a `deleted_business_messages` update for the given message IDs.
   * @param messageIds - Array of `message_id` values to mark as deleted.
   * @param options - Optional overrides such as a custom `chat_id`.
   */
  async deleteMessages(messageIds: number[], options: BusinessDeleteMessagesOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextUpdateId(),
      deleted_business_messages: {
        business_connection_id: this.connectionId,
        chat: {
          id: options.chatId ?? this.user.id,
          type: 'private' as const,
          first_name: this.user.first_name,
        },
        message_ids: messageIds,
      },
    } as Update);
  }
}
