/**
 * Plugin recipe: `@grammyjs/conversations` v2
 *
 * Pattern: multi-step conversation driven by sequential user.sendText calls.
 *
 * Setup notes:
 * - conversations() is the only middleware required; v2 uses internal storage
 *   by default — no external session middleware needed.
 * - createConversation(fn) registers the named conversation builder.
 * - ctx.conversation.enter("name") starts the conversation.
 * - Each conversation.wait() suspends until the next update arrives;
 *   dispatching via user.sendText() provides that update.
 *
 * Constraint: conversations v2 creates an internal Api instance that bypasses
 * the testing framework's transformer. API calls inside the conversation
 * function (ctx.reply, ctx.deleteMessage, etc.) do NOT appear in
 * chats.repliesFor(user). Pass client: { fetch: okFetch } to the Bot
 * constructor to prevent real HTTP requests from within conversations.
 * Use side effects (variables set inside the conversation function) to
 * assert on conversation logic.
 */

import { type Conversation, type ConversationFlavor, conversations, createConversation } from '@grammyjs/conversations';
import { Bot, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

/** Returns a minimal success response for any Telegram API call. */
const okFetch = (): Promise<{ ok: boolean; json: () => Promise<{ ok: boolean; result: boolean }>; text: () => Promise<string> }> =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ ok: true, result: true }),
    text: () => Promise.resolve('{"ok":true,"result":true}'),
  });

describe('plugin: @grammyjs/conversations', () => {
  it('multi-step conversation advances step-by-step', async () => {
    let observedName: string | undefined;
    let stepReached = 0;

    /**
     *
     * @param conversation
     * @param ctx
     */
    async function greetingConversation(conversation: MyConversation, ctx: MyContext): Promise<void> {
      stepReached = 1;
      await ctx.reply('What is your name?');
      const nameCtx = await conversation.wait();

      observedName = nameCtx.message?.text;
      stepReached = 2;
      await nameCtx.reply(`Hello, ${observedName ?? 'stranger'}!`);
    }

    const bot = new Bot<MyContext>('test-token', { client: { fetch: okFetch } });

    bot.use(conversations());
    bot.use(createConversation(greetingConversation));

    bot.command('start', (ctx) => ctx.conversation.enter('greetingConversation'));

    const { chats } = await prepareBot<MyContext>(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');

    expect(stepReached).toBe(1);

    await user.sendText('Alice');

    expect(stepReached).toBe(2);
    expect(observedName).toBe('Alice');
  });

  it('conversation state persists across dispatches', async () => {
    let firstMessageSeen: string | undefined;
    let secondMessageSeen: string | undefined;

    /**
     *
     * @param conversation
     */
    async function twoStepConversation(conversation: MyConversation): Promise<void> {
      const first = await conversation.wait();

      firstMessageSeen = first.message?.text;

      const second = await conversation.wait();

      secondMessageSeen = second.message?.text;
    }

    const bot = new Bot<MyContext>('test-token', { client: { fetch: okFetch } });

    bot.use(conversations());
    bot.use(createConversation(twoStepConversation));

    bot.command('start', (ctx) => ctx.conversation.enter('twoStepConversation'));

    const { chats } = await prepareBot<MyContext>(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');

    expect(firstMessageSeen).toBeUndefined();

    await user.sendText('step-one');

    expect(firstMessageSeen).toBe('step-one');
    expect(secondMessageSeen).toBeUndefined();

    await user.sendText('step-two');

    expect(firstMessageSeen).toBe('step-one');
    expect(secondMessageSeen).toBe('step-two');
  });
});
