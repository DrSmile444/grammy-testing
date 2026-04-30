/* eslint-disable max-classes-per-file -- RepliesInbox is tightly coupled to Chats */
/* eslint-disable prefer-const -- newUser uses let-then-assign for closure capture */
/* eslint-disable no-param-reassign -- attachBot intentionally hands bot to each chat */

import type { Bot, Context, RawApi } from 'grammy';
import type { Poll, Update } from 'grammy/types';

import type { IdleTracker } from '../low-level/idle';
import type { OutgoingRequests, Request } from '../low-level/outgoing-requests';

import { BusinessAccount } from './business-account';
import { Channel } from './channel';
import { type AnyChat, setBotRef } from './chat';
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

const MESSAGE_METHODS_GUARD = {
  sendMessage: true,
  sendPhoto: true,
  sendDocument: true,
  sendVideo: true,
  sendAudio: true,
  sendVoice: true,
  sendVideoNote: true,
  sendAnimation: true,
  sendSticker: true,
  sendLocation: true,
  sendContact: true,
  sendVenue: true,
  sendPoll: true,
  sendDice: true,
  sendMediaGroup: true,
  editMessageText: true,
  editMessageCaption: true,
  editMessageMedia: true,
} satisfies Partial<Record<keyof RawApi, true>>;

const MESSAGE_METHODS = new Set(Object.keys(MESSAGE_METHODS_GUARD));

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

      return typeof matcher === 'string' ? reply.text === matcher : matcher.test(reply.text);
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

interface BotRef<TContext extends Context> {
  readonly bot: Bot<TContext> | undefined;
}

/**
 * Wraps a `BotRef` in a Proxy so that `User` can hold a stable `Bot` reference even
 * though the bot is assigned to `Chats` after the user is constructed.
 * The proxy forwards all property reads to `ref.bot` at call time, relying on
 * `Chats.attachBot` running before any user verb is invoked.
 * @param ref - An object whose `bot` property will be resolved at each access.
 * @returns A `Bot` proxy that always delegates to the current `ref.bot` value.
 */
function undefinedSafeBot<TContext extends Context>(ref: BotRef<TContext>): Bot<TContext> {
  return new Proxy({} as Bot<TContext>, {
    get(_, prop) {
      const target = ref.bot as unknown as Record<string | symbol, unknown>;

      return target[prop];
    },
  });
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

  /** @internal */
  bot: Bot<TContext> | undefined;

  defaultGroup?: Supergroup<TContext>;

  constructor(
    public readonly outgoing: OutgoingRequests,
    idleTracker: IdleTracker,
  ) {
    this.idle = () => idleTracker.idle();
  }

  /**
   * Wires the grammY bot instance into every chat that has been registered so far,
   * and stores it for future chat registrations.
   * @param bot - The grammY `Bot` instance to attach.
   * @internal
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
      profile.first_name ?? `User${String(id)}`,
      profile.last_name,
      profile.username,
      {
        bot: undefinedSafeBot(this),
        ids: this.ids,
        defaultPrivateChat: () => this.privateChatFor(user).toTelegramChat(),
        resolveChatToTelegram: (chat) => chat.toTelegramChat(),
        updateMembership: (chat, who, mode) => {
          this.applyMembershipTransition(chat, who, mode);
        },
      },
      (chat: AnyChat<TContext>) => this.readMembership(user, chat),
    );

    this.users.set(id, { user, replies: new RepliesInbox<TContext>() });

    return user;
  }

  /**
   * Creates a new user and promotes them to administrator in the default supergroup.
   * The default supergroup is lazily created on the first call.
   * @param profile - Optional user profile overrides.
   * @param permissions - Optional permission flags for the admin role.
   * @returns The newly created administrator `User` instance.
   */
  newAdmin(profile: UserProfile = {}, permissions: PromotePermissions = {}): User<TContext> {
    const user = this.newUser(profile);

    this.defaultGroup ??= this.newSupergroup('default-group');
    this.defaultGroup.promote(user, permissions);

    return user;
  }

  /**
   * Returns (or lazily creates) the private chat associated with `user`.
   * @param user - The user whose private chat to retrieve.
   * @returns The `PrivateChat` instance for `user`.
   */
  newPrivateChat(user: User<TContext>): PrivateChat<TContext> {
    return this.privateChatFor(user);
  }

  /**
   * Iterate over every chat minted by this orchestrator (read-only view).
   * @returns An iterator over all registered chats.
   */
  get allChats(): IterableIterator<AnyChat<TContext>> {
    return this.chats.values();
  }

  /**
   * Iterate over every user minted by this orchestrator (read-only view).
   * @returns An iterator over all registered users.
   */
  get allUsers(): IterableIterator<User<TContext>> {
    const entries = [...this.users.values()];

    return entries.map((entry) => entry.user)[Symbol.iterator]();
  }

  /**
   * Creates a new group chat with an auto-generated negative ID.
   * @param title - Optional title; defaults to `Group<id>`.
   * @returns The new `Group` instance.
   */
  newGroup(title?: string): Group<TContext> {
    const id = this.ids.nextGroupId();
    const group = new Group<TContext>(id, title ?? `Group${String(-id)}`);

    this.registerChat(group);

    return group;
  }

  /**
   * Creates a new supergroup chat with an auto-generated negative ID.
   * @param title - Optional title; defaults to `Supergroup<id>`.
   * @returns The new `Supergroup` instance.
   */
  newSupergroup(title?: string): Supergroup<TContext> {
    const id = this.ids.nextSupergroupId();
    const supergroup = new Supergroup<TContext>(id, title ?? `Supergroup${String(-id)}`);

    this.registerChat(supergroup);

    return supergroup;
  }

  /**
   * Creates a new channel with an auto-generated negative ID.
   * @param title - Optional title; defaults to `Channel<id>`.
   * @returns The new `Channel` instance.
   */
  newChannel(title?: string): Channel<TContext> {
    const id = this.ids.nextChannelId();
    const channel = new Channel<TContext>(id, title ?? `Channel${String(-id)}`);

    this.registerChat(channel);

    return channel;
  }

  /**
   * Mints a `BusinessAccount` actor for the given user. The connection ID is
   * auto-generated as `biz-<n>`.
   * @param user - The user actor to associate with the business account.
   * @returns The new `BusinessAccount` instance.
   */
  newBusinessAccount(user: User<TContext>): BusinessAccount<TContext> {
    const connectionId = `biz-${String(this.ids.nextMessageId())}`;

    return new BusinessAccount<TContext>(user, connectionId, {
      bot: undefinedSafeBot(this),
      ids: this.ids,
    });
  }

  /**
   * Dispatches a `poll` update with the supplied `Poll` object. Use this to
   * simulate autonomous server-side poll state events.
   * @param poll - A `Poll` object describing the current poll state.
   * @param options - Optional overrides such as a custom `update_id`.
   */
  async dispatchPollState(poll: Poll, options: DispatchPollStateOptions = {}): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not attached — call prepareBot() first');
    }

    pollStateCounter += 1;

    await this.bot.handleUpdate({
      update_id: options.updateId ?? 1_770_000 + pollStateCounter,
      poll,
    } as Update);
  }

  /**
   * Processes a captured outgoing API call. Derives `chat.messages` and
   * `user.replies` projections.
   * @param request - The captured outgoing API request.
   * @internal
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

    const { bot } = this;

    if (!bot) {
      return;
    }

    const reply = new Reply<TContext>(payload, chat, {
      bot,
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

  private userReceivesReply(entry: UserEntry<TContext>, chat: AnyChat<TContext>, reply: Reply<TContext>): boolean {
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

      if (status === undefined || status === 'left' || status === 'kicked') {
        return false;
      }
    }

    // Rule 2: reply_to_message points at a message authored by this user
    // (we don't track historical message authors yet — defer to v0.2.x)

    // Rule 3: mention of @user.username
    if (entry.user.username && reply.mentionUsernames.has(entry.user.username)) {
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

  private registerChat(chat: Channel<TContext> | Group<TContext> | Supergroup<TContext>): void {
    chat.messages = new MessagesLog<TContext>();
    this.chats.set(chat.id, chat);

    if (this.bot) {
      chat[setBotRef](this.bot);
    }
  }

  private findChatByTelegramId(id: number): AnyChat<TContext> | undefined {
    return this.chats.get(id);
  }

  private readMembership(user: User<TContext>, chat: AnyChat<TContext>): Membership<TContext> | undefined {
    if (chat.type === 'private') {
      return undefined;
    }

    return chat.members.get(user.id);
  }

  /**
   * Applies a membership status transition after a service message dispatches.
   * `'join'` preserves higher privilege; `'leave'` always sets `status: 'left'`.
   * @param chat - The group or supergroup chat.
   * @param user - The member whose status is changing.
   * @param mode - Whether the user is joining or leaving.
   * @internal
   */
  private applyMembershipTransition(chat: Group<TContext> | Supergroup<TContext>, user: User<TContext>, mode: 'join' | 'leave'): void {
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
      (current.status === 'creator' || current.status === 'administrator' || current.status === 'restricted' || current.status === 'member')
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
   * @param user - The user whose inbox to retrieve.
   * @returns The `RepliesInbox` for `user`.
   */
  repliesFor(user: User<TContext>): RepliesInbox<TContext> {
    const entry = this.users.get(user.id);

    if (!entry) {
      throw new Error(`User ${String(user.id)} was not minted by this Chats instance`);
    }

    return entry.replies;
  }
}
