import type { Bot, Context } from 'grammy';
import type { Message, Update } from 'grammy/types';

import type { IdGenerator } from './id-generator';
import type { User } from './user';

let bizConnectionCounter = 1;
let bizMessageCounter = 1;
let bizEditedMessageCounter = 1;
let bizDeletedMessagesCounter = 1;

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
   * @param options
   */
  async connect(options: ConnectOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: 1_700_000 + bizConnectionCounter++,
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
   * @param options
   */
  async disconnect(options: ConnectOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: 1_700_000 + bizConnectionCounter++,
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
   * @param text
   * @param options
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
      update_id: 1_710_000 + bizMessageCounter++,
      business_message: message,
    } as Update);
  }

  /**
   * Dispatches an `edited_business_message` update for the given message ID.
   * @param messageId
   * @param newText
   * @param options
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
      update_id: 1_720_000 + bizEditedMessageCounter++,
      edited_business_message: message,
    } as Update);
  }

  /**
   * Dispatches a `deleted_business_messages` update for the given message IDs.
   * @param messageIds
   * @param options
   */
  async deleteMessages(messageIds: number[], options: BusinessDeleteMessagesOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: 1_730_000 + bizDeletedMessagesCounter++,
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
