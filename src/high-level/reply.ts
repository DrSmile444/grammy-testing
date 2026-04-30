import type { Bot, Context } from 'grammy';
import type { InlineKeyboardButton, Message, MessageEntity, ParseMode, Update } from 'grammy/types';

import type { AnyChat } from './chat';
import type { IdGenerator } from './id-generator';

export type MediaType = 'animation' | 'audio' | 'document' | 'photo' | 'sticker' | 'video' | 'video_note' | 'voice';

export interface ReplyMedia {
  type: MediaType;
  fileId: string;
}

// Exhaustive guard: adding a new MediaType member without updating this object is a compile error.
const MEDIA_FIELDS_GUARD: Record<MediaType, true> = {
  animation: true,
  audio: true,
  document: true,
  photo: true,
  sticker: true,
  video: true,
  video_note: true,
  voice: true,
};

const MEDIA_FIELDS = Object.keys(MEDIA_FIELDS_GUARD) as MediaType[];

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
  recordClick: (callbackData: string, byUserId: number, byChatId: number) => void;
  /** Looks up an earlier captured Reply by its synthetic messageId. */
  resolveReply: (messageId: number) => Reply<TContext> | undefined;
}

export interface ReplyClickButtonMatcher {
  callbackData: string;
}

interface FindButtonMatcher {
  callbackData: string;
}

interface ClickerFrom {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

interface Clicker {
  userId: number;
  from: ClickerFrom;
}

/**
 * Extracts a media file ID from the raw outgoing payload.
 * @param payload - The raw outgoing API payload.
 * @returns A {@link ReplyMedia} describing the media type and file ID, or `undefined` if none found.
 */
function deriveMedia(payload: Record<string, unknown>): ReplyMedia | undefined {
  for (const type of MEDIA_FIELDS) {
    const value = payload[type];

    if (value !== undefined) {
      return { type, fileId: typeof value === 'string' ? value : '[non-string-file]' };
    }
  }

  return undefined;
}

/**
 * Reads the reply-to message ID from a raw outgoing payload.
 * Supports both the legacy `reply_to_message_id` scalar and the modern
 * `reply_parameters.message_id` shape.
 * @param payload - The raw outgoing API payload.
 * @returns The referenced message ID, or `undefined` if not present.
 */
function readReplyToMessageId(payload: Record<string, unknown>): number | undefined {
  if (typeof payload.reply_to_message_id === 'number') {
    return payload.reply_to_message_id;
  }

  const params = payload.reply_parameters as { message_id?: number } | undefined;

  return params?.message_id;
}

/**
 * Collects all `@mention` usernames from an entity-annotated text string.
 * @param text - The message text, or `undefined` for non-text messages.
 * @param entities - The message entity array, or `undefined`.
 * @returns A `Set` of usernames without the leading `@`.
 */
function collectMentionUsernames(text: string | undefined, entities: MessageEntity[] | undefined): Set<string> {
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

/**
 * Parses the inline keyboard from a raw outgoing payload into a flat button list.
 * @param payload - The raw outgoing API payload.
 * @returns An array of {@link ReplyButton} objects, empty if no inline keyboard is present.
 */
function collectButtons(payload: Record<string, unknown>): ReplyButton[] {
  const replyMarkup = payload.reply_markup as { inline_keyboard?: InlineKeyboardButton[][] } | undefined;

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

/**
 * Finds the first button in a list matching the given text or callback-data matcher.
 * @param buttons - The button list to search.
 * @param matcher - Either a button text string or a `{ callbackData }` matcher object.
 * @returns The matching {@link ReplyButton}, or `undefined` if none found.
 */
function findButton(buttons: ReplyButton[], matcher: FindButtonMatcher | string): ReplyButton | undefined {
  if (typeof matcher === 'string') {
    return buttons.find((button) => button.text === matcher);
  }

  return buttons.find((button) => button.callbackData === matcher.callbackData);
}

/**
 * Infers the clicker identity from a private-chat context.
 * Returns `undefined` for group/channel chats where the clicker cannot be identified.
 * @param chat - The chat associated with the reply.
 * @returns A {@link Clicker} with user ID and Telegram `from` shape, or `undefined`.
 */
function inferClicker<TContext extends Context>(chat: AnyChat<TContext> | undefined): Clicker | undefined {
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

  readonly replyMarkup: Record<string, unknown> | undefined;

  readonly replyingTo: Reply<TContext> | undefined;

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

    this.entities = (rawPayload.entities ?? rawPayload.caption_entities) as MessageEntity[] | undefined;

    this.replyToMessageId = readReplyToMessageId(rawPayload);
    this.mentionUsernames = collectMentionUsernames(text, this.entities);
    this.buttons = collectButtons(rawPayload);
    this.media = deriveMedia(rawPayload);
    this.replyMarkup = rawPayload.reply_markup as Record<string, unknown> | undefined;

    this.replyingTo = this.replyToMessageId === undefined ? undefined : deps.resolveReply(this.replyToMessageId);
  }

  async clickButton(matcher: ReplyClickButtonMatcher | string): Promise<void> {
    const button = findButton(this.buttons, matcher);

    if (!button) {
      throw new Error(`clickButton: no button matching ${JSON.stringify(matcher)}`);
    }

    if (button.url !== undefined && button.callbackData === undefined) {
      throw new Error(`clickButton: button "${button.text}" has only a url; URL buttons do not produce callback_query updates`);
    }

    if (button.callbackData === undefined) {
      throw new Error(`clickButton: button "${button.text}" has no callback data`);
    }

    const { callbackData } = button;
    const clicker = inferClicker(this.chat);

    if (clicker && this.chat) {
      this.deps.recordClick(callbackData, clicker.userId, this.chat.id);
    }

    const update: Update = {
      update_id: 500_000 + this.deps.ids.nextMessageId(),
      callback_query: {
        id: `cbq-${String(this.deps.ids.nextMessageId())}`,
        from: clicker?.from ?? {
          id: 0,
          is_bot: false,
          first_name: 'unknown',
        },
        chat_instance: `inst-${String(this.messageId)}`,
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
      chat: this.chat ? this.chat.toTelegramChat() : ({ id: 0, type: 'private' } as Message['chat']),
      text: this.text,
      entities: this.entities,
    } as Message;
  }
}
