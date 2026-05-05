/**
 * Pattern: Mocked sessions (session, chatSession, state).
 *
 * What this exercises: the mockSession / mockChatSession / mockState
 * helpers — both the initial-value injection and cross-call mutation.
 * Bots that key behavior off ctx.session.language or ctx.chatSession.isBotAdmin
 * need this to work cleanly.
 *
 * v0.2 API expression: mockSession({ ... }) returning { session, mockSessionMiddleware }.
 * Same shape for mockChatSession / mockState. Mock value is mutable across
 * dispatches.
 *
 * v0.2.x gaps: none for this pattern category at v0.2.
 */

import { Bot, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';

import { type ChatSessionContext, mockChatSession, mockSession, prepareBot, type SessionContext } from '../../src/index';

describe('reference: sessions', () => {
  it('mockSession injects initial value and bot reads it', async () => {
    type Ctx = SessionContext<{ language?: string }>;

    const { mockSessionMiddleware } = mockSession<{ language?: string }, Ctx>({
      language: 'en',
    });

    const bot = new Bot<Ctx>('test-token');
    let observed: string | undefined;

    bot.use(mockSessionMiddleware);

    bot.on('message:text', async (context) => {
      observed = context.session.language;
      await context.reply(`lang=${context.session.language ?? 'unknown'}`);
    });

    const { chats } = await prepareBot<Ctx>(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(observed).toBe('en');
    expect(chats.repliesFor(user).last?.text).toBe('lang=en');
  });

  it('cross-call mutation: mutate session between dispatches', async () => {
    type Ctx = SessionContext<{ language?: string }>;

    const { session, mockSessionMiddleware } = mockSession<{ language?: string }, Ctx>({
      language: 'en',
    });

    const bot = new Bot<Ctx>('test-token');
    const observed: (string | undefined)[] = [];

    bot.use(mockSessionMiddleware);

    bot.on('message:text', (context) => {
      observed.push(context.session.language);
    });

    const { chats } = await prepareBot<Ctx>(bot);
    const user = chats.newUser();

    await user.sendText('first');
    session.language = 'uk';
    await user.sendText('second');

    expect(observed).toEqual(['en', 'uk']);
  });

  it('mockChatSession holds chat-scoped flags read by the bot', async () => {
    type Ctx = ChatSessionContext<{ isBotAdmin: boolean }>;

    const { mockChatSessionMiddleware } = mockChatSession<{ isBotAdmin: boolean }, Ctx>({
      isBotAdmin: true,
    });

    const bot = new Bot<Ctx>('test-token');
    let didObserve: boolean | undefined;

    bot.use(mockChatSessionMiddleware);

    bot.on('message:text', (context) => {
      didObserve = context.chatSession.isBotAdmin;
    });

    const { chats } = await prepareBot<Ctx>(bot);
    const user = chats.newUser();

    await user.sendText('hi');

    expect(didObserve).toBe(true);
  });

  it('combined mockSession + mockChatSession in one bot', async () => {
    interface SessionData {
      language?: string;
    }
    interface ChatSessionData {
      isBotAdmin: boolean;
    }
    interface Ctx extends Context {
      session: SessionData;
      chatSession: ChatSessionData;
    }

    const { mockSessionMiddleware } = mockSession<SessionData, Ctx>({
      language: 'en',
    });

    const { mockChatSessionMiddleware } = mockChatSession<ChatSessionData, Ctx>({
      isBotAdmin: true,
    });

    const bot = new Bot<Ctx>('test-token');
    let combined: string | undefined;

    bot.use(mockSessionMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.on('message:text', (context) => {
      combined = `${context.session.language ?? '?'}|${String(context.chatSession.isBotAdmin)}`;
    });

    const { chats } = await prepareBot<Ctx>(bot);
    const user = chats.newUser();

    await user.sendText('hi');

    expect(combined).toBe('en|true');
  });
});
