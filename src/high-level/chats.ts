/* eslint-disable max-classes-per-file -- RepliesInbox is tightly coupled to Chats */
/* eslint-disable prefer-const -- newUser uses let-then-assign for closure capture */
/* eslint-disable no-param-reassign -- attachBot intentionally hands bot to each chat */


import type { Bot, Context } from 'grammy';

import type { IdleTracker } from '../low-level/idle';
import type { OutgoingRequests, Request } from '../low-level/outgoing-requests';

import { BusinessAccount } from './business-account';
import { Channel } from './channel';
import { type AnyChat,setBotRef } from './chat';
import { Group } from './group';
import { IdGenerator } from './id-generator';
import { MessagesLog } from './messages-log';
import { PrivateChat } from './private-chat';
import { Reply } from './reply';
import { Supergroup } from './supergroup';
import type { Membership, PromotePermissions } from './types';
import { User, type UserProfile } from './user';

let pollStateCounter = 1;

export interface DispatchPollStateOptions {
  /** Override the auto-generated update_id. */
  updateId?: number;
}

const MESSAGE_METHODS = new Set([
  'sendMessage',
  'sendPhoto',
  'sendDocument',
  'sendVideo',
  'sendAudio',
  'sendVoice',
  'sendVideoNote',
  'sendAnimation',
  'sendSticker',
  'sendLocation',
  'sendContact',
  'sendVenue',
  'sendPoll',
  'sendDice',
  'sendMediaGroup',
  'editMessageText',
  'editMessageCaption',
  'editMessageMedia',
]);

/**
 * Per-user inbox: filtered view of messages directed at this user.
 */
export class RepliesInbox<TContext extends Context = Context> {
  private readonly items: Reply<TContext>[] = [];

  push(reply: Reply<TContext>): void {
    this.items.push(reply);
  }

  get length(): number {
    return this.items.length;
  }

  get last(): Reply<TContext> | undefined {
    return this.items.at(-1);
  }

  get all(): readonly Reply<TContext>[] {
    return this.items;
  }

  byText(matcher: RegExp | string): Reply<TContext> | undefined {
    return this.items.find((reply) => {
      if (reply.text === undefined) {
        return false;
      }

      return typeof matcher === 'string'
        ? reply.text === matcher
        : matcher.test(reply.text);
    });
  }

  clear(): void {
    this.items.length = 0;
  }
}

interface UserEntry<TContext extends Context = Context> {
  user: User<TContext>;
  replies: RepliesInbox<TContext>;
  privateChat?: PrivateChat<TContext>;
}

/**
 * The orchestrator returned from every entry point's `chats` field.
 * Mints users and chats, exposes the v0.1 capture surface
 * (`outgoing`, `idle`), and derives high-level views (`user.replies`,
 * `chat.messages`) from each captured outgoing call.
 */
export class Chats<TContext extends Context = Context> {
  readonly idle: () => Promise<void>;

  private readonly ids = new IdGenerator();

  private readonly users = new Map<number, UserEntry<TContext>>();

  private readonly chats = new Map<number, AnyChat<TContext>>();

  /** click->user association for the user.replies filter rule. */
  private readonly clickers = new Map<string, number>();

  /** messageId->Reply registry for reply.replyingTo resolution. */
  private readonly messageIdToReply = new Map<number, Reply<TContext>>();

  /** @internal — assigned in prepareBot before bot.init(). */
  bot!: Bot<TContext>;

  defaultGroup?: Supergroup<TContext>;

  constructor(
    public readonly outgoing: OutgoingRequests,
    idleTracker: IdleTracker,
  ) {
    this.idle = () => idleTracker.idle();
  }

  /**
   * @param bot
   * @internal — called once by prepareBot after bot.init resolves.
   */
  attachBot(bot: Bot<TContext>): void {
    this.bot = bot;

    for (const chat of this.chats.values()) {
       
      chat[setBotRef](bot);
    }
  }

  newUser(profile: UserProfile = {}): User<TContext> {
    const id = profile.id ?? this.ids.nextUserId();
    // Two-phase: declare `user` so closures capture it by reference,
    // then assign before any closure can fire.
     
    let user!: User<TContext>;

    user = new User<TContext>(
      id,
      profile.first_name ?? `User${id}`,
      profile.last_name,
      profile.username,
      {
        bot: undefinedSafeBot(this),
        ids: this.ids,
        defaultPrivateChat: () => this.privateChatFor(user).toTelegramChat(),
        resolveChatToTelegram: (chat) => chat.toTelegramChat(),
        updateMembership: (chat, who, mode) =>
          { this.applyMembershipTransition(chat, who, mode); },
      },
      (chat) => this.readMembership(user, chat),
    );

    this.users.set(id, { user, replies: new RepliesInbox<TContext>() });

    return user;
  }

  newAdmin(
    profile: UserProfile = {},
    permissions: PromotePermissions = {},
  ): User<TContext> {
    const user = this.newUser(profile);

    this.defaultGroup ??= this.newSupergroup('default-group');
    this.defaultGroup.promote(user, permissions);

    return user;
  }

  newPrivateChat(user: User<TContext>): PrivateChat<TContext> {
    return this.privateChatFor(user);
  }

  /**
   * Iterate over every chat minted by this orchestrator (read-only view).
   */
  get allChats(): IterableIterator<AnyChat<TContext>> {
    return this.chats.values();
  }

  /**
   * Iterate over every user minted by this orchestrator (read-only view).
   */
  get allUsers(): IterableIterator<User<TContext>> {
    const entries = [...this.users.values()];

    return entries.map((e) => e.user)[Symbol.iterator]();
  }

  newGroup(title?: string): Group<TContext> {
    const id = this.ids.nextGroupId();
    const group = new Group<TContext>(id, title ?? `Group${-id}`);

    this.registerChat(group);

    return group;
  }

  newSupergroup(title?: string): Supergroup<TContext> {
    const id = this.ids.nextSupergroupId();
    const supergroup = new Supergroup<TContext>(id, title ?? `Supergroup${-id}`);

    this.registerChat(supergroup);

    return supergroup;
  }

  newChannel(title?: string): Channel<TContext> {
    const id = this.ids.nextChannelId();
    const channel = new Channel<TContext>(id, title ?? `Channel${-id}`);

    this.registerChat(channel);

    return channel;
  }

  /**
   * Mints a `BusinessAccount` actor for the given user. The connection ID is
   * auto-generated as `biz-<n>`.
   * @param user
   */
  newBusinessAccount(user: User<TContext>): BusinessAccount<TContext> {
    const connectionId = `biz-${this.ids.nextMessageId()}`;

    return new BusinessAccount<TContext>(user, connectionId, {
      bot: undefinedSafeBot(this),
      ids: this.ids,
    });
  }

  /**
   * Dispatches a `poll` update with the supplied `Poll` object. Use this to
   * simulate autonomous server-side poll state events.
   * @param poll
   * @param options
   */
  async dispatchPollState(
    poll: import('grammy/types').Poll,
    options: DispatchPollStateOptions = {},
  ): Promise<void> {
    await this.bot.handleUpdate({
      update_id: options.updateId ?? (1_770_000 + pollStateCounter++),
      poll,
    } as import('grammy/types').Update);
  }

  /**
   * @param request
   * @internal — invoked by the transformer for every captured outgoing
   * call. Derives `chat.messages` and `user.replies` projections.
   */
  deriveFromCapture(request: Request): void {
    if (!MESSAGE_METHODS.has(request.method)) {
      return;
    }

    const payload = request.payload as Record<string, unknown>;
    const chatId = payload.chat_id as number | string | undefined;

    if (chatId === undefined) {
      return;
    }

    const chat = this.findChatByTelegramId(Number(chatId));

    if (!chat) {
      return; // not a known chat — skip silently
    }

    const reply = new Reply<TContext>(payload, chat, {
      bot: this.bot,
      ids: this.ids,
      recordClick: (callbackData, byUserId) => {
        this.clickers.set(callbackData, byUserId);
      },
      resolveReply: (messageId) => this.messageIdToReply.get(messageId),
    });

    this.messageIdToReply.set(reply.messageId, reply);

    chat.messages.push(reply);

    for (const entry of this.users.values()) {
      if (this.userReceivesReply(entry, chat, reply)) {
        entry.replies.push(reply);
      }
    }
  }

  private userReceivesReply(
    entry: UserEntry<TContext>,
    chat: AnyChat<TContext>,
    reply: Reply<TContext>,
  ): boolean {
    // Rule 1: chat is private with this user
    if (chat.type === 'private' && chat.id === entry.user.id) {
      return true;
    }

    // Rule 1 cont'd: user must be an *active* participant of the
    // group/supergroup/channel. 'left' and 'kicked' are NOT participants.
    if (chat.type !== 'private') {
      if (!('members' in chat)) {
        return false;
      }

      const status = chat.members.get(entry.user.id)?.status;

      if (
        status === undefined ||
        status === 'left' ||
        status === 'kicked'
      ) {
        return false;
      }
    }

    // Rule 2: reply_to_message points at a message authored by this user
    // (we don't track historical message authors yet — defer to v0.2.x)

    // Rule 3: mention of @user.username
    if (
      entry.user.username &&
      reply.mentionUsernames.has(entry.user.username)
    ) {
      return true;
    }

    // Rule 4: response after a clickButton by this user
    // (heuristic: most-recent click whose callbackData matches the user)
    for (const [, byUserId] of this.clickers) {
      if (byUserId === entry.user.id) {
        return true;
      }
    }

    return false;
  }

  private privateChatFor(user: User<TContext>): PrivateChat<TContext> {
    const entry = this.users.get(user.id);

    if (entry?.privateChat) {
      return entry.privateChat;
    }

    const chat = new PrivateChat<TContext>(user);

    if (entry) {
      entry.privateChat = chat;
    }

    this.chats.set(chat.id, chat);

    if (this.bot) {
      chat[setBotRef](this.bot);
    }

    return chat;
  }

  private registerChat(
    chat: Channel<TContext> | Group<TContext> | Supergroup<TContext>,
  ): void {
    chat.messages = new MessagesLog<TContext>();
    this.chats.set(chat.id, chat);

    if (this.bot) {
      chat[setBotRef](this.bot);
    }
  }

  private findChatByTelegramId(id: number): AnyChat<TContext> | undefined {
    return this.chats.get(id);
  }

  private readMembership(
    user: User<TContext>,
    chat: AnyChat<TContext>,
  ): Membership<TContext> | undefined {
    if (chat.type === 'private') {
      return undefined;
    }

    return chat.members.get(user.id);
  }

  /**
   * @param chat
   * @param user
   * @param mode
   * @internal — invoked by `User.joinChat` and `User.leaveChat` after
   * the service message has dispatched. `'join'` preserves higher
   * privilege; `'leave'` always sets `status: 'left'`.
   */
  private applyMembershipTransition(
    chat: Group<TContext> | Supergroup<TContext>,
    user: User<TContext>,
    mode: 'join' | 'leave',
  ): void {
    if (mode === 'leave') {
      chat.members.set(user.id, {
        user,
        chat,
        status: 'left',
        permissions: {},
      });

      return;
    }

    // mode === 'join': don't downgrade existing privileged status.
    const current = chat.members.get(user.id);

    if (
      current &&
      (current.status === 'creator' ||
        current.status === 'administrator' ||
        current.status === 'restricted' ||
        current.status === 'member')
    ) {
      return;
    }

    chat.members.set(user.id, {
      user,
      chat,
      status: 'member',
      permissions: {},
    });
  }

  /**
   * Access the per-user replies inbox.
   * @param user
   */
  repliesFor(user: User<TContext>): RepliesInbox<TContext> {
    const entry = this.users.get(user.id);

    if (!entry) {
      throw new Error(`User ${user.id} was not minted by this Chats instance`);
    }

    return entry.replies;
  }
}

/**
 * Helper that lets `User` reach `Chats.bot` even though the bot is
 * assigned after the user is constructed — we hand back a thunk-style
 * proxy via the User's UserContext.bot reference. Implementation: we
 * rely on assignment order — Chats.attachBot runs before any user verb
 * is called, so the bot reference is non-null at call time.
 * @param chats
 */
function undefinedSafeBot<TContext extends Context>(
  chats: Chats<TContext>,
): Bot<TContext> {
  // Returning a Proxy would be more defensive but heavier. Trust the
  // bot is set before user verbs are invoked.
  return new Proxy({} as Bot<TContext>, {
    get(_, prop) {
      const target = chats.bot as unknown as Record<string | symbol, unknown>;

      return target[prop];
    },
  });
}
