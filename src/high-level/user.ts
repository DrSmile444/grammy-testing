import type { Bot, Context } from 'grammy';
import type { Chat, Message, MessageEntity, MessageOrigin, ReactionType, ShippingAddress, Update } from 'grammy/types';

import type { AnyChat } from './chat';
import { dispatchEditedMessage, dispatchServiceMessage, dispatchTextMessage } from './dispatch';
import type { Group } from './group';
import type { IdGenerator } from './id-generator';
import {
  makeAnimationStub,
  makeAudioStub,
  makeDocumentStub,
  makePhotoSizeStub,
  makeStickerStub,
  makeVideoNoteStub,
  makeVideoStub,
  makeVoiceStub,
} from './media-stubs';
import type { Reply } from './reply';
import type { Supergroup } from './supergroup';
import type { Membership } from './types';

export interface UserProfile {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface SendTextOptionsReplyParameter {
  message_id: number;
}

export interface SendTextOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
  entities?: MessageEntity[];
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_parameters?: SendTextOptionsReplyParameter;
  reply_to_message?: Message;
}

export interface SendForwardedOptions<TContext extends Context = Context> {
  forwardOrigin: MessageOrigin;
  chat?: AnyChat<TContext>;
}

export interface SendPhotoOptions<TContext extends Context = Context> {
  caption?: string;
  chat?: AnyChat<TContext>;
}

export interface SendDocumentOptions<TContext extends Context = Context> {
  caption?: string;
  chat?: AnyChat<TContext>;
}

export interface SendVideoOptions<TContext extends Context = Context> {
  caption?: string;
  chat?: AnyChat<TContext>;
}

export interface SendAudioOptions<TContext extends Context = Context> {
  caption?: string;
  chat?: AnyChat<TContext>;
}

export interface SendVoiceOptions<TContext extends Context = Context> {
  caption?: string;
  chat?: AnyChat<TContext>;
}

export interface SendVideoNoteOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendAnimationOptions<TContext extends Context = Context> {
  caption?: string;
  chat?: AnyChat<TContext>;
}

export interface SendStickerOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendLocationOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendContactOptions<TContext extends Context = Context> {
  lastName?: string;
  chat?: AnyChat<TContext>;
}

export interface SendVenueOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendPollOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendDiceOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendWebAppDataOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendSuccessfulPaymentOptions<TContext extends Context = Context> {
  chat?: AnyChat<TContext>;
}

export interface SendInlineQueryOptions {
  chatType?: 'channel' | 'group' | 'private' | 'sender' | 'supergroup';
}

export interface ReactToOptions {
  date?: number;
}

export interface AnswerPollOptions {
  voterChat?: Chat;
}

export interface RequestJoinOptions {
  bio?: string;
}

export interface BoostChatOptions {
  expirationDays?: number;
}

export interface RemoveBoostOptions {
  removeDate?: number;
}

export interface ManageBotOptions {
  /** Override the auto-generated update_id. */
  updateId?: number;
}

export interface PurchasePaidMediaOptions {
  /** Override the auto-generated update_id. */
  updateId?: number;
}

/** Minimal bot user profile for `user.manageBot`. */
export interface BotUserProfile {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface UserContext<TContext extends Context = Context> {
  bot: Bot<TContext>;
  ids: IdGenerator;
  defaultPrivateChat: () => Chat.PrivateChat;
  resolveChatToTelegram: (chat: AnyChat<TContext>) => Chat;
  /**
   * Update the membership map on join / leave. Chats owns the
   * "don't-downgrade-on-join" / "always-set-left" logic.
   */
  updateMembership: (chat: Group<TContext> | Supergroup<TContext>, user: User<TContext>, mode: 'join' | 'leave') => void;
}

export interface UserSendMediaGroupItem<TContext extends Context = Context> {
  caption?: string;
  photo?: string | null;
  video?: string | null;
  document?: string | null;
  chat?: AnyChat<TContext>;
}

/**
 * High-level participant actor. Verbs (`sendText`, `sendCommand`,
 * `sendMediaGroup`) construct synthetic updates and dispatch them
 * via `bot.handleUpdate`.
 *
 * `User` carries no per-chat permissions — those live on the chat's
 * `Membership` record, not the user. See `user.in(chat)`.
 */
export class User<TContext extends Context = Context> {
  /** @internal */
  readonly is_bot = false;

  readonly first_name: string;

  readonly last_name: string | undefined;

  constructor(
    public readonly id: number,
    firstName: string,
    lastName: string | undefined,
    public readonly username: string | undefined,
    /** @internal */
    private readonly ctx: UserContext<TContext>,
    /** @internal */
    private readonly membershipReader: (chat: AnyChat<TContext>) => Membership<TContext> | undefined,
  ) {
    this.first_name = firstName;
    this.last_name = lastName;
  }

  in(chat: AnyChat<TContext>): Membership<TContext> | undefined {
    return this.membershipReader(chat);
  }

  async sendText(text: string, options: SendTextOptions<TContext> = {}): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    await dispatchTextMessage({
      bot: this.ctx.bot,
      user: this,
      chat: targetChat,
      text,
      messageId: this.ctx.ids.nextMessageId(),
      updateId: this.ctx.ids.nextMessageId() + 100_000,
      entities: options.entities,
      replyToMessageId: options.reply_parameters?.message_id,
      replyToMessage: options.reply_to_message,
    });
  }

  async sendMessage(text: string, options: SendTextOptions<TContext> = {}): Promise<void> {
    return this.sendText(text, options);
  }

  async sendForwarded(text: string, options: SendForwardedOptions<TContext>): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    await dispatchTextMessage({
      bot: this.ctx.bot,
      user: this,
      chat: targetChat,
      text,
      messageId: this.ctx.ids.nextMessageId(),
      updateId: this.ctx.ids.nextMessageId() + 100_000,
      forwardOrigin: options.forwardOrigin,
    });
  }

  async editMessage(messageId: number, text: string, options: { chat?: AnyChat<TContext> } = {}): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    await dispatchEditedMessage({
      bot: this.ctx.bot,
      user: this,
      chat: targetChat,
      messageId,
      text,
      updateId: this.ctx.ids.nextMessageId() + 500_000,
    });
  }

  async joinChat(chat: Group<TContext> | Supergroup<TContext>): Promise<void> {
    const chatWithType = chat as { type: string };

    if (chatWithType.type !== 'group' && chatWithType.type !== 'supergroup') {
      throw new Error(
        `joinChat: target chat type "${chatWithType.type}" does not support new_chat_members service messages — only groups and supergroups do`,
      );
    }

    await dispatchServiceMessage({
      bot: this.ctx.bot,
      kind: 'new_chat_members',
      user: this,
      chat: chat.toTelegramChat(),
      messageId: this.ctx.ids.nextMessageId(),
      updateId: 600_000,
    });

    this.ctx.updateMembership(chat, this, 'join');
  }

  async leaveChat(chat: Group<TContext> | Supergroup<TContext>): Promise<void> {
    const chatWithType = chat as { type: string };

    if (chatWithType.type !== 'group' && chatWithType.type !== 'supergroup') {
      throw new Error(
        `leaveChat: target chat type "${chatWithType.type}" does not support left_chat_member service messages — only groups and supergroups do`,
      );
    }

    await dispatchServiceMessage({
      bot: this.ctx.bot,
      kind: 'left_chat_member',
      user: this,
      chat: chat.toTelegramChat(),
      messageId: this.ctx.ids.nextMessageId(),
      updateId: 700_000,
    });

    this.ctx.updateMembership(chat, this, 'leave');
  }

  async sendCommand(command: string, args?: string, options: { chat?: AnyChat<TContext> } = {}): Promise<void> {
    const normalized = command.startsWith('/') ? command : `/${command}`;
    const text = args ? `${normalized} ${args}` : normalized;

    const entities: MessageEntity[] = [{ type: 'bot_command', offset: 0, length: normalized.length }];

    return this.sendText(text, { entities, chat: options.chat });
  }

  async sendPhoto(file?: string, options: SendPhotoOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: {
        id: this.id,
        is_bot: false,
        first_name: this.first_name,
        last_name: this.last_name,
        username: this.username,
      },
      photo: [makePhotoSizeStub(fileId)],
      caption: options.caption,
    } as Message;

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 200_000,
      message,
    } as Update);
  }

  async sendDocument(file?: string, options: SendDocumentOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: {
        id: this.id,
        is_bot: false,
        first_name: this.first_name,
        last_name: this.last_name,
        username: this.username,
      },
      document: makeDocumentStub(fileId),
      caption: options.caption,
    } as Message;

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 200_000,
      message,
    } as Update);
  }

  async sendVideo(file?: string, options: SendVideoOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: {
        id: this.id,
        is_bot: false,
        first_name: this.first_name,
        last_name: this.last_name,
        username: this.username,
      },
      video: makeVideoStub(fileId),
      caption: options.caption,
    } as Message;

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 200_000,
      message,
    } as Update);
  }

  async sendAudio(file?: string, options: SendAudioOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      audio: makeAudioStub(fileId),
      caption: options.caption,
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendVoice(file?: string, options: SendVoiceOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      voice: makeVoiceStub(fileId),
      caption: options.caption,
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendVideoNote(file?: string, options: SendVideoNoteOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      video_note: makeVideoNoteStub(fileId),
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendAnimation(file?: string, options: SendAnimationOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      animation: makeAnimationStub(fileId),
      caption: options.caption,
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendSticker(file?: string, options: SendStickerOptions<TContext> = {}): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      sticker: makeStickerStub(fileId),
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendLocation(latitude: number, longitude: number, options: SendLocationOptions<TContext> = {}): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      location: { latitude, longitude },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendContact(phoneNumber: string, firstName: string, options: SendContactOptions<TContext> = {}): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      contact: { phone_number: phoneNumber, first_name: firstName, last_name: options.lastName },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendVenue(
    latitude: number,
    longitude: number,
    title: string,
    address: string,
    options: SendVenueOptions<TContext> = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      venue: { location: { latitude, longitude }, title, address },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendPoll(question: string, answerOptions: string[], options: SendPollOptions<TContext> = {}): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      poll: {
        id: `poll-${String(this.ctx.ids.nextMessageId())}`,
        question,
        options: answerOptions.map((text) => ({ text, voter_count: 0 })),
        total_voter_count: 0,
        is_closed: false,
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false,
        allows_revoting: false,
      },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendDice(emoji = '🎲', options: SendDiceOptions<TContext> = {}): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      dice: { emoji, value: 1 },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendWebAppData(webAppData: string, buttonText: string, options: SendWebAppDataOptions<TContext> = {}): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      web_app_data: { data: webAppData, button_text: buttonText },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendSuccessfulPayment(
    invoicePayload: string,
    currency: string,
    totalAmount: number,
    options: SendSuccessfulPaymentOptions<TContext> = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat ? this.ctx.resolveChatToTelegram(options.chat) : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      successful_payment: {
        currency,
        total_amount: totalAmount,
        invoice_payload: invoicePayload,
        telegram_payment_charge_id: 'charge-tg-stub',
        provider_payment_charge_id: 'charge-provider-stub',
      },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendInlineQuery(query: string, options: SendInlineQueryOptions = {}): Promise<void> {
    const update: Update = {
      update_id: this.ctx.ids.nextMessageId() + 800_000,
      inline_query: {
        id: `iq-${String(this.ctx.ids.nextMessageId())}`,
        from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
        query,
        offset: '',
        chat_type: options.chatType ?? 'sender',
      },
    } as Update;

    await this.ctx.bot.handleUpdate(update);
  }

  async sendChosenInlineResult(resultId: string, query: string): Promise<void> {
    const update: Update = {
      update_id: this.ctx.ids.nextMessageId() + 850_000,
      chosen_inline_result: {
        result_id: resultId,
        from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
        query,
      },
    } as Update;

    await this.ctx.bot.handleUpdate(update);
  }

  async sendPreCheckoutQuery(invoicePayload: string, currency: string, totalAmount: number): Promise<void> {
    const update: Update = {
      update_id: this.ctx.ids.nextMessageId() + 900_000,
      pre_checkout_query: {
        id: `pcq-${String(this.ctx.ids.nextMessageId())}`,
        from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
        currency,
        total_amount: totalAmount,
        invoice_payload: invoicePayload,
      },
    } as Update;

    await this.ctx.bot.handleUpdate(update);
  }

  async sendShippingQuery(invoicePayload: string, shippingAddress: ShippingAddress): Promise<void> {
    const update: Update = {
      update_id: this.ctx.ids.nextMessageId() + 950_000,
      shipping_query: {
        id: `shq-${String(this.ctx.ids.nextMessageId())}`,
        from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
        invoice_payload: invoicePayload,
        shipping_address: shippingAddress,
      },
    } as Update;

    await this.ctx.bot.handleUpdate(update);
  }

  async sendMediaGroup(items: UserSendMediaGroupItem<TContext>[], sharedOptions: { chat?: AnyChat<TContext> } = {}): Promise<void> {
    const mediaGroupId = this.ctx.ids.nextMediaGroupId();

    const targetChat: Chat = sharedOptions.chat ? this.ctx.resolveChatToTelegram(sharedOptions.chat) : this.ctx.defaultPrivateChat();

    for (const item of items) {
      const itemChat = item.chat ? this.ctx.resolveChatToTelegram(item.chat) : targetChat;

      const message: Message = {
        message_id: this.ctx.ids.nextMessageId(),
        date: Math.floor(Date.now() / 1000),
        chat: itemChat,
        from: {
          id: this.id,
          is_bot: false,
          first_name: this.first_name,
          last_name: this.last_name,
          username: this.username,
        },
        media_group_id: mediaGroupId,
        caption: item.caption,
        photo: item.photo ? [makePhotoSizeStub(item.photo)] : undefined,
        document: item.document ? makeDocumentStub(item.document) : undefined,
        video: item.video ? makeVideoStub(item.video) : undefined,
      } as Message;

      const update: Update = {
        update_id: 400_000 + this.ctx.ids.nextMessageId(),
        message,
      } as Update;

      // eslint-disable-next-line no-await-in-loop -- preserve dispatch order
      await this.ctx.bot.handleUpdate(update);
    }
  }

  /**
   * Dispatches a `message_reaction` update — the user reacting to a bot reply.
   * `reaction` may be a `ReactionType` object or a plain emoji string
   * (auto-wrapped as `{ type: 'emoji', emoji }`).
   * @param reply - The captured bot reply the user is reacting to.
   * @param reaction - The reaction to apply: a `ReactionType` object or a plain emoji string.
   * @param options - Optional overrides such as a custom reaction timestamp.
   */
  async reactTo(reply: Reply<TContext>, reaction: ReactionType | string, options: ReactToOptions = {}): Promise<void> {
    const normalizedReaction: ReactionType = typeof reaction === 'string' ? ({ type: 'emoji', emoji: reaction } as ReactionType) : reaction;

    const chat = reply.chat ? reply.chat.toTelegramChat() : this.ctx.defaultPrivateChat();

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 1_000_000,
      message_reaction: {
        chat,
        message_id: reply.messageId,
        user: {
          id: this.id,
          is_bot: false,
          first_name: this.first_name,
          last_name: this.last_name,
          username: this.username,
        },
        date: options.date ?? Math.floor(Date.now() / 1000),
        old_reaction: [],
        new_reaction: [normalizedReaction],
      },
    } as Update);
  }

  /**
   * Dispatches a `poll_answer` update — the user voting in a poll.
   * `reply` must be a captured bot reply for a `sendPoll` / `replyWithPoll`
   * call. Because the Telegram Bot API assigns `poll.id` server-side,
   * the outgoing request payload does not contain it; a synthetic id
   * (`poll-reply-<messageId>`) is generated automatically when the reply
   * looks like a `sendPoll` call (has a `question` field). Throws if the
   * reply cannot be identified as a poll.
   *
   * Pass `options.voterChat` to simulate an anonymous poll vote from a chat.
   * @param reply - The captured bot reply containing the poll.
   * @param optionIndices - Zero-based indices of the poll options the user selects.
   * @param options - Optional overrides such as a `voterChat` for anonymous votes.
   */
  async answerPoll(reply: Reply<TContext>, optionIndices: number[], options: AnswerPollOptions = {}): Promise<void> {
    const poll = reply.raw.poll as { id?: string } | undefined;

    // The Telegram API assigns poll.id server-side; outgoing sendPoll
    // request payloads don't include it. Fall back to a synthetic id when
    // the reply has a `question` field (discriminator for sendPoll calls).
    const pollId = poll?.id ?? (reply.raw.question === undefined ? undefined : `poll-reply-${String(reply.messageId)}`);

    if (!pollId) {
      throw new Error('answerPoll: reply does not contain a poll — reply.raw.poll.id is missing');
    }

    const fromUser = options.voterChat
      ? undefined
      : {
          id: this.id,
          is_bot: false,
          first_name: this.first_name,
          last_name: this.last_name,
          username: this.username,
        };

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 1_100_000,
      poll_answer: {
        poll_id: pollId,
        voter_chat: options.voterChat,
        user: fromUser,
        option_ids: optionIndices,
        option_persistent_ids: [],
      },
    } as Update);
  }

  /**
   * Dispatches a `chat_join_request` update — the user requesting to join a
   * group or supergroup.
   * @param group - The group or supergroup the user wants to join.
   * @param options - Optional overrides such as a custom `bio` string.
   */
  async requestJoin(group: Group<TContext> | Supergroup<TContext>, options: RequestJoinOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 1_200_000,
      chat_join_request: {
        chat: group.toTelegramChat(),
        from: {
          id: this.id,
          is_bot: false,
          first_name: this.first_name,
          last_name: this.last_name,
          username: this.username,
        },
        user_chat_id: this.id,
        date: Math.floor(Date.now() / 1000),
        bio: options.bio,
      },
    } as Update);
  }

  /**
   * Dispatches a `chat_boost` update — the user boosting a chat.
   * Returns the generated `boost_id` so callers can pass it to
   * `removeBoost`.
   * @param chat - The chat the user is boosting.
   * @param options - Optional overrides such as a custom expiration duration.
   * @returns The generated `boost_id` string for use with `removeBoost`.
   */
  async boostChat(chat: AnyChat<TContext>, options: BoostChatOptions = {}): Promise<string> {
    const boostId = `boost-${String(this.ctx.ids.nextMessageId())}`;
    const now = Math.floor(Date.now() / 1000);
    const expirationDays = options.expirationDays ?? 30;

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 1_300_000,
      chat_boost: {
        chat: chat.toTelegramChat(),
        boost: {
          boost_id: boostId,
          add_date: now,
          expiration_date: now + expirationDays * 86_400,
          source: {
            source: 'premium',
            user: {
              id: this.id,
              is_bot: false,
              first_name: this.first_name,
              last_name: this.last_name,
              username: this.username,
            },
          },
        },
      },
    } as Update);

    return boostId;
  }

  /**
   * Dispatches a `removed_chat_boost` update — the user removing a boost from
   * a chat. Pass the `boost_id` returned by `boostChat`.
   * @param chat - The chat from which the boost is being removed.
   * @param boostId - The `boost_id` returned by a prior `boostChat` call.
   * @param options - Optional overrides such as a custom removal timestamp.
   */
  async removeBoost(chat: AnyChat<TContext>, boostId: string, options: RemoveBoostOptions = {}): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    await this.ctx.bot.handleUpdate({
      update_id: this.ctx.ids.nextMessageId() + 1_400_000,
      removed_chat_boost: {
        chat: chat.toTelegramChat(),
        boost_id: boostId,
        remove_date: options.removeDate ?? now,
        source: {
          source: 'premium',
          user: {
            id: this.id,
            is_bot: false,
            first_name: this.first_name,
            last_name: this.last_name,
            username: this.username,
          },
        },
      },
    } as Update);
  }

  /**
   * Dispatches a `managed_bot` update — the user managing a bot they own.
   * `botUser` is a plain profile object with at minimum `id` and `first_name`.
   * @param botUser - The bot profile being managed (requires at minimum `id` and `first_name`).
   * @param options - Optional overrides such as a custom `update_id`.
   */
  async manageBot(botUser: BotUserProfile, options: ManageBotOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: options.updateId ?? this.ctx.ids.nextMessageId() + 1_740_000,
      managed_bot: {
        user: {
          id: this.id,
          is_bot: false,
          first_name: this.first_name,
          last_name: this.last_name,
          username: this.username,
        },
        bot: {
          id: botUser.id,
          is_bot: true,
          first_name: botUser.first_name,
          last_name: botUser.last_name,
          username: botUser.username,
        },
      },
    } as Update);
  }

  /**
   * Dispatches a `purchased_paid_media` update — the user purchasing paid
   * media from the bot. `payload` is the bot-specified paid media payload.
   * @param payload - The bot-specified paid media payload string.
   * @param options - Optional overrides such as a custom `update_id`.
   */
  async purchasePaidMedia(payload: string, options: PurchasePaidMediaOptions = {}): Promise<void> {
    await this.ctx.bot.handleUpdate({
      update_id: options.updateId ?? this.ctx.ids.nextMessageId() + 1_750_000,
      purchased_paid_media: {
        from: {
          id: this.id,
          is_bot: false,
          first_name: this.first_name,
          last_name: this.last_name,
          username: this.username,
        },
        paid_media_payload: payload,
      },
    } as Update);
  }
}
