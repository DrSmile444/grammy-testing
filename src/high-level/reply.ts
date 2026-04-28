 

import type { Bot, Context } from 'grammy';
import type {
  InlineKeyboardButton,
  Message,
  MessageEntity,
  Update,
} from 'grammy/types';

import type { AnyChat } from './chat';
import type { IdGenerator } from './id-generator';

export type ParseMode = 'HTML' | 'Markdown' | 'MarkdownV2';

export type MediaType =
  | 'animation'
  | 'audio'
  | 'document'
  | 'photo'
  | 'sticker'
  | 'video'
  | 'video_note'
  | 'voice';

export interface ReplyMedia {
  type: MediaType;
  fileId: string;
}

const MEDIA_FIELDS: MediaType[] = ['photo', 'document', 'video', 'audio', 'voice', 'animation', 'sticker', 'video_note'];

export interface ReplyButton {
  text: string;
  callbackData?: string;
  url?: string;
  raw: InlineKeyboardButton;
}

interface ReplyDeps<TContext extends Context = Context> {
  bot: Bot<TContext>;
  ids: IdGenerator;
  /** Records a click association so user.replies can include the resulting message. */
  recordClick: (callbackData: string, byUserId: number) => void;
}

export interface ReplyClickButtonMatcher { data: string }

/**
 * Normalized view of a captured outgoing message-shape API call.
 * `Reply` instances are plain values (not proxies), safe to snapshot
 * and pass around.
 */
export class Reply<TContext extends Context = Context> {
  readonly text: string | undefined;

  readonly parseMode: ParseMode | undefined;

  readonly entities: MessageEntity[] | undefined;

  readonly buttons: ReplyButton[];

  readonly media: ReplyMedia | undefined;

  readonly chat: AnyChat<TContext> | undefined;

  /** The synthetic message_id assigned to this captured reply. */
  readonly messageId: number;

  /** The original captured outgoing-API payload (escape hatch). */
  readonly raw: Record<string, unknown>;

  /** Recorded for `user.replies` filter rule. */
  readonly replyToMessageId: number | undefined;

  /** Recorded for `user.replies` filter rule. */
  readonly mentionUsernames: ReadonlySet<string>;

  constructor(
    rawPayload: Record<string, unknown>,
    chat: AnyChat<TContext> | undefined,
    private readonly deps: ReplyDeps<TContext>,
  ) {
    this.raw = rawPayload;
    this.chat = chat;
    this.messageId = deps.ids.nextMessageId();

    const text = (rawPayload.text ?? rawPayload.caption) as string | undefined;

    this.text = text;
    this.parseMode = rawPayload.parse_mode as ParseMode | undefined;

    this.entities = (rawPayload.entities ?? rawPayload.caption_entities) as
      | MessageEntity[]
      | undefined;

    this.replyToMessageId = readReplyToMessageId(rawPayload);
    this.mentionUsernames = collectMentionUsernames(text, this.entities);
    this.buttons = collectButtons(rawPayload);
    this.media = deriveMedia(rawPayload);
  }

  async clickButton(matcher: ReplyClickButtonMatcher | string): Promise<void> {
    const button = findButton(this.buttons, matcher);

    if (!button) {
      throw new Error(
        `clickButton: no button matching ${JSON.stringify(matcher)}`,
      );
    }

    if (button.url !== undefined && button.callbackData === undefined) {
      throw new Error(
        `clickButton: button "${button.text}" has only a url; URL buttons do not produce callback_query updates`,
      );
    }

    const callbackData = button.callbackData!;
    const clicker = inferClicker(this.chat);

    if (clicker) {
      this.deps.recordClick(callbackData, clicker.userId);
    }

    const update: Update = {
      update_id: 500_000 + this.deps.ids.nextMessageId(),
      callback_query: {
        id: `cbq-${this.deps.ids.nextMessageId()}`,
        from: clicker?.from ?? {
          id: 0,
          is_bot: false,
          first_name: 'unknown',
        },
        chat_instance: `inst-${this.messageId}`,
        message: this.toCapturedMessage(),
        data: callbackData,
      },
    } as Update;

    await this.deps.bot.handleUpdate(update);
  }

  private toCapturedMessage(): Message {
    return {
      message_id: this.messageId,
      date: Math.floor(Date.now() / 1000),
      chat: this.chat
        ? this.chat.toTelegramChat()
        : ({ id: 0, type: 'private' } as Message['chat']),
      text: this.text,
      entities: this.entities,
    } as Message;
  }
}

function deriveMedia(payload: Record<string, unknown>): ReplyMedia | undefined {
  for (const type of MEDIA_FIELDS) {
    const value = payload[type];

    if (value !== undefined) {
      return { type, fileId: typeof value === 'string' ? value : '[non-string-file]' };
    }
  }

  return undefined;
}

function readReplyToMessageId(payload: Record<string, unknown>): number | undefined {
  if (typeof payload.reply_to_message_id === 'number') {
    return payload.reply_to_message_id;
  }

  const params = payload.reply_parameters as
    | { message_id?: number }
    | undefined;

  return params?.message_id;
}

function collectMentionUsernames(
  text: string | undefined,
  entities: MessageEntity[] | undefined,
): Set<string> {
  const usernames = new Set<string>();

  if (text === undefined || entities === undefined) {
    return usernames;
  }

  for (const entity of entities) {
    if (entity.type === 'mention') {
      const slice = text.slice(entity.offset, entity.offset + entity.length);

      if (slice.startsWith('@')) {
        usernames.add(slice.slice(1));
      }
    }
  }

  return usernames;
}

function collectButtons(payload: Record<string, unknown>): ReplyButton[] {
  const replyMarkup = payload.reply_markup as
    | { inline_keyboard?: InlineKeyboardButton[][] }
    | undefined;

  if (!replyMarkup?.inline_keyboard) {
    return [];
  }

  const buttons: ReplyButton[] = [];

  for (const row of replyMarkup.inline_keyboard) {
    for (const raw of row) {
      buttons.push({
        text: raw.text,
        callbackData: 'callback_data' in raw ? raw.callback_data : undefined,
        url: 'url' in raw ? raw.url : undefined,
        raw,
      });
    }
  }

  return buttons;
}

interface FindButtonMatcher { data: string }

function findButton(
  buttons: ReplyButton[],
  matcher: FindButtonMatcher | string,
): ReplyButton | undefined {
  if (typeof matcher === 'string') {
    return buttons.find((b) => b.text === matcher);
  }

  return buttons.find((b) => b.callbackData === matcher.data);
}

interface ClickerFrom { id: number; is_bot: boolean; first_name: string; username?: string }

interface Clicker {
  userId: number;
  from: ClickerFrom;
}

function inferClicker<TContext extends Context>(
  chat: AnyChat<TContext> | undefined,
): Clicker | undefined {
  if (!chat) {
    return undefined;
  }

  if (chat.type === 'private') {
    return {
      userId: chat.user.id,
      from: {
        id: chat.user.id,
        is_bot: false,
        first_name: chat.user.first_name,
        username: chat.user.username,
      },
    };
  }

  return undefined;
}
