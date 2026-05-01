import { Bot, Composer, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot, prepareComposer, prepareMiddleware } from '../../src/index';
import { MessagePrivateMockUpdate, type StateContext } from '../../src/low-level';

const passThroughMiddleware: Parameters<typeof prepareMiddleware>[0] = (_context, next) => next();

describe('entry points', () => {
  describe('prepareBot', () => {
    it('resolves with a chats handle exposing outgoing and idle', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);

      expect(chats.outgoing).toBeDefined();
      expect(typeof chats.idle).toBe('function');
    });

    it('pre-populates botInfo without an extra getMe round-trip', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);

      expect(bot.botInfo).toBeDefined();
      expect(bot.botInfo.is_bot).toBe(true);
      expect(chats.outgoing.requests).toEqual([]);
    });

    it('captures bot.api calls after init', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);

      await bot.api.sendMessage(1, 'hello');

      const last = chats.outgoing.getLast();

      expect(last?.method).toBe('sendMessage');
      expect((last?.payload as { text: string }).text).toBe('hello');
    });

    it('captures ctx.reply via middleware', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (context) => {
        await context.reply(`echo: ${context.message.text}`);
      });

      const { chats } = await prepareBot(bot);

      await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());

      const last = chats.outgoing.getLast();

      expect(last?.method).toBe('sendMessage');
      expect((last?.payload as { text: string }).text).toBe('echo: hi');
    });

    it('sendMessage default response carries the synthetic message_id from the captured reply', async () => {
      const bot = new Bot('test-token');
      let sentMessageId: number | undefined;

      bot.on('message:text', async (ctx) => {
        const sent = await ctx.reply('hello');

        sentMessageId = sent.message_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      expect(sentMessageId).toBeDefined();
      expect(sentMessageId).toBe(user.replies.lastOrThrow().messageId);
    });

    it('bot can read sent.message_id to drive editMessageText', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        const sent = await ctx.reply('loading…');

        await ctx.api.editMessageText(ctx.chat.id, sent.message_id, 'done');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      expect(chats.editsFor(user).lastOrThrow().text).toBe('done');
    });

    it('user-supplied responses.sendMessage overrides the synthetic default', async () => {
      const bot = new Bot('test-token');
      let sentMessageId: number | undefined;

      bot.on('message:text', async (ctx) => {
        const sent = await ctx.reply('hello');

        sentMessageId = sent.message_id;
      });

      const { chats } = await prepareBot(bot, {
        responses: {
          sendMessage: { message_id: 9999, date: 0, text: 'hello' },
        },
      });

      const user = chats.newUser();

      await user.sendText('trigger');

      expect(sentMessageId).toBe(9999);
    });

    it('uses static canned responses', async () => {
      const bot = new Bot('test-token');

      await prepareBot(bot, {
        responses: {
          getChat: { id: 99, type: 'supergroup', title: 'Static' },
        },
      });

      const result = await bot.api.getChat(99);

      expect(result.id).toBe(99);
      expect(result.title).toBe('Static');
    });

    it('uses function canned responses dispatched on payload', async () => {
      const bot = new Bot('test-token');

      const usersById: Record<number, { id: number; first_name: string; is_bot: boolean }> = {
        1: { id: 1, first_name: 'A', is_bot: false },
        2: { id: 2, first_name: 'B', is_bot: false },
      };

      await prepareBot(bot, {
        responses: {
          getChatMember: ({ user_id: userId }) => ({
            status: 'member',
            user: usersById[userId],
          }),
        },
      });

      const memberA = await bot.api.getChatMember(0, 1);
      const memberB = await bot.api.getChatMember(0, 2);

      expect(memberA.user.first_name).toBe('A');
      expect(memberB.user.first_name).toBe('B');
    });
  });

  describe('prepareComposer', () => {
    it('drives a single composer in isolation', async () => {
      const composer = new Composer();

      composer.command('ping', async (context) => {
        await context.reply('pong');
      });

      const { chats } = await prepareComposer(composer);

      expect(chats.outgoing).toBeDefined();
      expect(typeof chats.idle).toBe('function');
    });

    it('state option pre-populates ctx.state before the composer runs', async () => {
      interface MyState {
        isRussian: boolean;
        score: number;
      }

      type MyContext = Context & StateContext<MyState>;

      let observedState: MyState | undefined;

      const composer = new Composer<MyContext>();

      composer.on('message:text', (ctx) => {
        observedState = ctx.state;
      });

      const { chats } = await prepareComposer<MyContext>(composer, {
        state: { isRussian: true, score: 42 },
      });

      const user = chats.newUser();

      await user.sendText('hi');

      expect(observedState?.isRussian).toBe(true);
      expect(observedState?.score).toBe(42);
    });
  });

  describe('prepareMiddleware', () => {
    it('drives a single middleware function', async () => {
      interface MiddlewareContext {
        reply: (text: string) => Promise<unknown>;
      }

      const middleware = async (context: MiddlewareContext, next: () => Promise<unknown>) => {
        await context.reply('hi');
        await next();
      };

      const { chats } = await prepareMiddleware(middleware as never);

      expect(chats.outgoing).toBeDefined();
      expect(typeof chats.idle).toBe('function');
    });

    it('state option pre-populates ctx.state before the middleware runs', async () => {
      interface MyState {
        lang: string;
      }

      type MyContext = Context & StateContext<MyState>;

      let observedLang: string | undefined;

      const { chats } = await prepareMiddleware<MyContext>(
        (ctx, next) => {
          observedLang = ctx.state.lang;

          return next();
        },
        { state: { lang: 'uk' } },
      );

      const user = chats.newUser();

      await user.sendText('test');

      expect(observedLang).toBe('uk');
    });
  });

  describe('uniform shape across entry points', () => {
    it('all three return { chats } with outgoing and idle', async () => {
      const bot = new Bot('test-token');
      const composer = new Composer();
      const middleware = passThroughMiddleware;

      const botResult = await prepareBot(bot);
      const composerResult = await prepareComposer(composer);
      const middlewareResult = await prepareMiddleware(middleware);

      for (const { chats } of [botResult, composerResult, middlewareResult]) {
        expect(chats.outgoing).toBeDefined();
        expect(typeof chats.idle).toBe('function');
      }
    });
  });
});
