import type { Bot, Context } from 'grammy';
import type { Chat, ChatMember, Message, MessageEntity, MessageOrigin, Update, User as TelegramUser } from 'grammy/types';

import type { ChatMemberStatus, PermissionFlags } from './types';
import type { User } from './user';

/**
 * Exhaustive-switch guard — throws at runtime when an unhandled discriminant is reached.
 * @param x - The value that should have been handled.
 */
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}

const CHANNEL_BOT_ID = 136_817_688;

/**
 * Pure helper: build the synthetic `Channel_Bot` user that real
 * Telegram inserts as `from` on channel-posts-into-groups.
 * @returns A `TelegramUser` representing the Telegram channel bot user.
 */
export function makeChannelBotUser(): TelegramUser {
  return {
    id: CHANNEL_BOT_ID,
    is_bot: false,
    first_name: 'Channel',
    username: 'Channel_Bot',
  };
}

/**
 * Pure helper: build a `ChatMember` value matching Telegram's
 * shape for a given status + permissions. Used by `my_chat_member`
 * dispatch.
 * @param user - Telegram user object to embed in the chat member.
 * @param status - The member's current chat status.
 * @param permissions - Permission flags applicable for the given status.
 * @param untilDate - Unix timestamp for temporary restrictions or bans.
 * @returns A fully shaped `ChatMember` union value.
 */
export function makeChatMember(user: TelegramUser, status: ChatMemberStatus, permissions: PermissionFlags, untilDate?: number): ChatMember {
  switch (status) {
    case 'creator': {
      return {
        status: 'creator',
        user,
        is_anonymous: permissions.is_anonymous ?? false,
      };
    }

    case 'administrator': {
      return {
        status: 'administrator',
        user,
        can_be_edited: permissions.can_be_edited ?? false,
        is_anonymous: permissions.is_anonymous ?? false,
        can_manage_chat: permissions.can_manage_chat ?? false,
        can_change_info: permissions.can_change_info ?? false,
        can_delete_messages: permissions.can_delete_messages ?? false,
        can_invite_users: permissions.can_invite_users ?? false,
        can_restrict_members: permissions.can_restrict_members ?? false,
        can_pin_messages: permissions.can_pin_messages ?? false,
        can_promote_members: permissions.can_promote_members ?? false,
        can_manage_video_chats: permissions.can_manage_video_chats ?? false,
        can_post_stories: permissions.can_post_stories ?? false,
        can_edit_stories: permissions.can_edit_stories ?? false,
        can_delete_stories: permissions.can_delete_stories ?? false,
        can_manage_topics: permissions.can_manage_topics ?? false,
        // Optional channel-only field — omit when not supplied so group admins aren't affected.
        ...(permissions.can_post_messages !== undefined && { can_post_messages: permissions.can_post_messages }),
      };
    }

    case 'member': {
      return { status: 'member', user };
    }

    case 'restricted': {
      // Cast: grammy/types adds new permission flags over time
      // (e.g. can_edit_tag); permissions is intentionally lenient.
      return {
        status: 'restricted',
        user,
        is_member: permissions.is_member ?? true,
        can_send_messages: permissions.can_send_messages ?? false,
        can_send_audios: permissions.can_send_audios ?? false,
        can_send_documents: permissions.can_send_documents ?? false,
        can_send_photos: permissions.can_send_photos ?? false,
        can_send_videos: permissions.can_send_videos ?? false,
        can_send_video_notes: permissions.can_send_video_notes ?? false,
        can_send_voice_notes: permissions.can_send_voice_notes ?? false,
        can_send_polls: permissions.can_send_polls ?? false,
        can_send_other_messages: permissions.can_send_other_messages ?? false,
        can_add_web_page_previews: permissions.can_add_web_page_previews ?? false,
        can_change_info: permissions.can_change_info ?? false,
        can_invite_users: permissions.can_invite_users ?? false,
        can_pin_messages: permissions.can_pin_messages ?? false,
        can_manage_topics: permissions.can_manage_topics ?? false,
        until_date: untilDate ?? 0,
      } as ChatMember;
    }

    case 'left': {
      return { status: 'left', user };
    }

    case 'kicked': {
      return { status: 'kicked', user, until_date: untilDate ?? 0 };
    }

    default: {
      return assertNever(status);
    }
  }
}

interface MyChatMemberDispatch<TContext extends Context> {
  chat: Chat.ChannelChat | Chat.GroupChat | Chat.SupergroupChat;
  /** Trigger actor — populates `my_chat_member.from`. */
  user: User<TContext>;
  /** The bot's own identity — populates `old/new_chat_member.user`. */
  botUser: TelegramUser;
  fromStatus: ChatMemberStatus;
  toStatus: ChatMemberStatus;
  permissions: PermissionFlags;
  untilDate?: number;
  updateId: number;
}

/**
 * Dispatches a `my_chat_member` update simulating a change in the bot's own membership status.
 * @param bot - The grammY `Bot` instance to dispatch the update to.
 * @param spec - Parameters describing the membership transition.
 */
export async function dispatchMyChatMember<TContext extends Context>(
  bot: Bot<TContext>,
  spec: MyChatMemberDispatch<TContext>,
): Promise<void> {
  const fromUser: TelegramUser = {
    id: spec.user.id,
    is_bot: false,
    first_name: spec.user.first_name,
    last_name: spec.user.last_name,
    username: spec.user.username,
  };

  const update: Update = {
    update_id: spec.updateId,
    my_chat_member: {
      chat: spec.chat,
      from: fromUser,
      date: Math.floor(Date.now() / 1000),
      old_chat_member: makeChatMember(spec.botUser, spec.fromStatus, spec.permissions, spec.untilDate),
      new_chat_member: makeChatMember(spec.botUser, spec.toStatus, spec.permissions, spec.untilDate),
    },
  };

  await bot.handleUpdate(update);
}

interface ServiceMessageDispatch<TContext extends Context> {
  bot: Bot<TContext>;
  kind: 'left_chat_member' | 'new_chat_members';
  user: User<TContext>;
  chat: Chat.GroupChat | Chat.SupergroupChat;
  messageId: number;
  updateId: number;
}

/**
 * Dispatches a `message` update containing a `new_chat_members` or `left_chat_member`
 * service message for the given user.
 * @param spec - Parameters describing the service message.
 */
export async function dispatchServiceMessage<TContext extends Context>(spec: ServiceMessageDispatch<TContext>): Promise<void> {
  const fromUser: TelegramUser = {
    id: spec.user.id,
    is_bot: false,
    first_name: spec.user.first_name,
    last_name: spec.user.last_name,
    username: spec.user.username,
  };

  const baseMessage: Partial<Message> = {
    message_id: spec.messageId,
    date: Math.floor(Date.now() / 1000),
    chat: spec.chat,
    from: fromUser,
  };

  const message =
    spec.kind === 'new_chat_members'
      ? ({ ...baseMessage, new_chat_members: [fromUser] } as Message)
      : ({ ...baseMessage, left_chat_member: fromUser } as Message);

  const update: Update = {
    update_id: spec.updateId,
    message,
  } as Update;

  await spec.bot.handleUpdate(update);
}

interface EditedMessageDispatch<TContext extends Context> {
  bot: Bot<TContext>;
  user: User<TContext>;
  chat: Chat;
  messageId: number;
  text: string;
  updateId: number;
}

/**
 * Dispatches an `edited_message` update for the given user and chat.
 * @param spec - Parameters describing the edited message.
 */
export async function dispatchEditedMessage<TContext extends Context>(spec: EditedMessageDispatch<TContext>): Promise<void> {
  const fromUser: TelegramUser = {
    id: spec.user.id,
    is_bot: false,
    first_name: spec.user.first_name,
    last_name: spec.user.last_name,
    username: spec.user.username,
  };

  const now = Math.floor(Date.now() / 1000);

  const update: Update = {
    update_id: spec.updateId,
    edited_message: {
      message_id: spec.messageId,
      date: now,
      edit_date: now,
      chat: spec.chat,
      from: fromUser,
      text: spec.text,
    },
  } as Update;

  await spec.bot.handleUpdate(update);
}

interface ChatMemberDispatch<TContext extends Context> {
  bot: Bot<TContext>;
  chat: Chat;
  fromAdmin: User<TContext>;
  targetUser: User<TContext>;
  newStatus: ChatMemberStatus;
  oldStatus?: ChatMemberStatus;
  permissions?: PermissionFlags;
  updateId: number;
}

/**
 * Dispatches a `chat_member` update representing an admin changing another user's membership status.
 * @param spec - Parameters describing the chat member status change.
 */
export async function dispatchChatMember<TContext extends Context>(spec: ChatMemberDispatch<TContext>): Promise<void> {
  const adminUser: TelegramUser = {
    id: spec.fromAdmin.id,
    is_bot: false,
    first_name: spec.fromAdmin.first_name,
    last_name: spec.fromAdmin.last_name,
    username: spec.fromAdmin.username,
  };

  const targetTelegramUser: TelegramUser = {
    id: spec.targetUser.id,
    is_bot: false,
    first_name: spec.targetUser.first_name,
    last_name: spec.targetUser.last_name,
    username: spec.targetUser.username,
  };

  const update: Update = {
    update_id: spec.updateId,
    chat_member: {
      chat: spec.chat,
      from: adminUser,
      date: Math.floor(Date.now() / 1000),
      old_chat_member: makeChatMember(targetTelegramUser, spec.oldStatus ?? 'member', {}),
      new_chat_member: makeChatMember(targetTelegramUser, spec.newStatus, spec.permissions ?? {}),
    },
  } as Update;

  await spec.bot.handleUpdate(update);
}

interface PrivateMessageDispatch<TContext extends Context> {
  bot: Bot<TContext>;
  user: User<TContext>;
  chat: Chat;
  text: string;
  messageId: number;
  updateId: number;
  entities?: MessageEntity[];
  replyToMessageId?: number;
  replyToMessage?: Message;
  forwardOrigin?: MessageOrigin;
  /** When set, replaces the `from` field derived from `user`. */
  fromOverride?: TelegramUser;
  /** When set, adds `sender_chat` to the dispatched message. */
  senderChat?: Chat;
}

/**
 * Dispatches a text `message` update from a user in a given chat.
 * @param spec - Parameters describing the outgoing text message.
 */
export async function dispatchTextMessage<TContext extends Context>(spec: PrivateMessageDispatch<TContext>): Promise<void> {
  const fromUser: TelegramUser = spec.fromOverride ?? {
    id: spec.user.id,
    is_bot: false,
    first_name: spec.user.first_name,
    last_name: spec.user.last_name,
    username: spec.user.username,
  };

  const message: Message = {
    message_id: spec.messageId,
    date: Math.floor(Date.now() / 1000),
    chat: spec.chat,
    from: fromUser,
    text: spec.text,
    entities: spec.entities,
    reply_to_message: spec.replyToMessage,
    forward_origin: spec.forwardOrigin,
    ...(spec.senderChat !== undefined && { sender_chat: spec.senderChat }),
  } as Message;

  const update: Update = {
    update_id: spec.updateId,
    message,
  } as Update;

  await spec.bot.handleUpdate(update);
}
