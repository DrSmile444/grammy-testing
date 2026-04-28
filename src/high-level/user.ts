 

import type { Bot, Context } from 'grammy';
import type { Chat, Message, MessageEntity, MessageOrigin, Update } from 'grammy/types';

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
import type { Supergroup } from './supergroup';
import type { Membership } from './types';

export interface UserProfile {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface SendTextOptionsReplyParameter { message_id: number }

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

interface UserContext<TContext extends Context = Context> {
  bot: Bot<TContext>;
  ids: IdGenerator;
  defaultPrivateChat: () => Chat.PrivateChat;
  resolveChatToTelegram: (chat: AnyChat<TContext>) => Chat;
  /**
   * Update the membership map on join / leave. Chats owns the
   * "don't-downgrade-on-join" / "always-set-left" logic.
   */
  updateMembership: (
    chat: Group<TContext> | Supergroup<TContext>,
    user: User<TContext>,
    mode: 'join' | 'leave',
  ) => void;
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
  /** @internal — read by Group/Supergroup membership maps. */
  readonly is_bot = false;

  constructor(
    public readonly id: number,
    public readonly first_name: string,
    public readonly last_name: string | undefined,
    public readonly username: string | undefined,
    /** @internal */
    private readonly ctx: UserContext<TContext>,
    /** @internal — Chats fills this so `user.in(group)` works. */
    private readonly membershipReader: (
      chat: AnyChat<TContext>,
    ) => Membership<TContext> | undefined,
  ) {}

  in(chat: AnyChat<TContext>): Membership<TContext> | undefined {
    return this.membershipReader(chat);
  }

  async sendText(
    text: string,
    options: SendTextOptions<TContext> = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async sendMessage(
    text: string,
    options: SendTextOptions<TContext> = {},
  ): Promise<void> {
    return this.sendText(text, options);
  }

  async sendForwarded(
    text: string,
    options: SendForwardedOptions<TContext>,
  ): Promise<void> {
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async editMessage(
    messageId: number,
    text: string,
    options: { chat?: AnyChat<TContext> } = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

    await dispatchEditedMessage({
      bot: this.ctx.bot,
      user: this,
      chat: targetChat,
      messageId,
      text,
      updateId: this.ctx.ids.nextMessageId() + 500_000,
    });
  }

  async joinChat(
    chat: Group<TContext> | Supergroup<TContext>,
  ): Promise<void> {
    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      throw new Error(
        `joinChat: target chat type "${(chat as { type: string }).type}" does not support new_chat_members service messages — only groups and supergroups do`,
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

  async leaveChat(
    chat: Group<TContext> | Supergroup<TContext>,
  ): Promise<void> {
    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      throw new Error(
        `leaveChat: target chat type "${(chat as { type: string }).type}" does not support left_chat_member service messages — only groups and supergroups do`,
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

  async sendCommand(
    command: string,
    args?: string,
    options: { chat?: AnyChat<TContext> } = {},
  ): Promise<void> {
    const normalized = command.startsWith('/') ? command : `/${command}`;
    const text = args ? `${normalized} ${args}` : normalized;

    const entities: MessageEntity[] = [
      { type: 'bot_command', offset: 0, length: normalized.length },
    ];

    return this.sendText(text, { entities, chat: options.chat });
  }

  async sendPhoto(
    file?: string,
    options: SendPhotoOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async sendDocument(
    file?: string,
    options: SendDocumentOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async sendVideo(
    file?: string,
    options: SendVideoOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async sendAudio(
    file?: string,
    options: SendAudioOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async sendVoice(
    file?: string,
    options: SendVoiceOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async sendVideoNote(
    file?: string,
    options: SendVideoNoteOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      video_note: makeVideoNoteStub(fileId),
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendAnimation(
    file?: string,
    options: SendAnimationOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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

  async sendSticker(
    file?: string,
    options: SendStickerOptions<TContext> = {},
  ): Promise<void> {
    const fileId = file ?? this.ctx.ids.nextFileId();

    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      sticker: makeStickerStub(fileId),
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendLocation(
    latitude: number,
    longitude: number,
    options: SendLocationOptions<TContext> = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      location: { latitude, longitude },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendContact(
    phoneNumber: string,
    firstName: string,
    options: SendContactOptions<TContext> = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

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
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      venue: { location: { latitude, longitude }, title, address },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendPoll(
    question: string,
    answerOptions: string[],
    options: SendPollOptions<TContext> = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      poll: {
        id: `poll-${this.ctx.ids.nextMessageId()}`,
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

  async sendDice(
    emoji = '🎲',
    options: SendDiceOptions<TContext> = {},
  ): Promise<void> {
    const targetChat: Chat = options.chat
      ? this.ctx.resolveChatToTelegram(options.chat)
      : this.ctx.defaultPrivateChat();

    const message: Message = {
      message_id: this.ctx.ids.nextMessageId(),
      date: Math.floor(Date.now() / 1000),
      chat: targetChat,
      from: { id: this.id, is_bot: false, first_name: this.first_name, last_name: this.last_name, username: this.username },
      dice: { emoji, value: 1 },
    } as Message;

    await this.ctx.bot.handleUpdate({ update_id: this.ctx.ids.nextMessageId() + 200_000, message } as Update);
  }

  async sendMediaGroup(
    items: UserSendMediaGroupItem<TContext>[],
    sharedOptions: { chat?: AnyChat<TContext> } = {},
  ): Promise<void> {
    const mediaGroupId = this.ctx.ids.nextMediaGroupId();

    const targetChat: Chat = sharedOptions.chat
      ? this.ctx.resolveChatToTelegram(sharedOptions.chat)
      : this.ctx.defaultPrivateChat();

    for (const item of items) {
      const itemChat = item.chat
        ? this.ctx.resolveChatToTelegram(item.chat)
        : targetChat;

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
}

/**
 * The synthetic Channel_Bot user — re-exported here for convenience.
 */


export {makeChannelBotUser} from './dispatch';