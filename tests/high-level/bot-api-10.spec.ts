/**
 * Tests for Bot API 10.0 / 10.1 support: rich messages, live photos, message drafts,
 * guest mode, join-request queries, reaction removal, and managed-bot defaults.
 */

import { Bot } from 'grammy';
import type { InlineQueryResult } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

const ARTICLE: InlineQueryResult = {
  type: 'article',
  id: '1',
  title: 'Answer',
  input_message_content: { message_text: 'guest reply' },
};

describe('Bot API 10: new message-sending methods', () => {
  it('sendRichMessage resolves with a synthetic Message and is logged', async () => {
    const bot = new Bot('test-token');
    let returnedId: number | undefined;

    bot.on('message:text', async (ctx) => {
      const sent = await ctx.api.sendRichMessage(ctx.chat.id, { html: '<b>hi</b>' });

      returnedId = sent.message_id;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(returnedId).toBeGreaterThan(0);
    expect(user.replies.lastOrThrow().messageId).toBe(returnedId);
    expect(user.replies.lastOrThrow().richMessage?.html).toBe('<b>hi</b>');
  });

  it('sendLivePhoto resolves with a Message and lands in chat.messages', async () => {
    const bot = new Bot('test-token');
    let returnedId: number | undefined;

    bot.on('message:text', async (ctx) => {
      const sent = await ctx.api.sendLivePhoto(ctx.chat.id, 'live-file', 'photo-file');

      returnedId = sent.message_id;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const user = chats.newUser();

    group.join(user);

    await user.sendText('go', { chat: group });

    const logged = group.messages.last;

    expect(returnedId).toBeGreaterThan(0);
    expect(logged?.messageId).toBe(returnedId);
  });

  it('user-supplied responses override the synthetic sendRichMessage default', async () => {
    const bot = new Bot('test-token');
    let returnedId: number | undefined;

    bot.on('message:text', async (ctx) => {
      const sent = await ctx.api.sendRichMessage(ctx.chat.id, { html: '<b>x</b>' });

      returnedId = sent.message_id;
    });

    const { chats } = await prepareBot(bot, { responses: { sendRichMessage: { message_id: 9999, date: 0 } } });
    const user = chats.newUser();

    await user.sendText('go');

    expect(returnedId).toBe(9999);
  });
});

describe('Bot API 10: rich message read ergonomics', () => {
  it('reply.richMessage is undefined for a plain text reply', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('plain');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(user.replies.lastOrThrow().richMessage).toBeUndefined();
  });

  it('plainText strips html tags', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendRichMessage(ctx.chat.id, { html: '<b>hello</b> <i>world</i>' });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(user.replies.lastOrThrow().richMessage?.plainText).toBe('hello world');
  });

  it('plainText strips markdown markup', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendRichMessage(ctx.chat.id, { markdown: '**hello** _world_' });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(user.replies.lastOrThrow().richMessage?.plainText).toBe('hello world');
  });
});

describe('Bot API 10: message drafts', () => {
  it('a draft send appears in the drafts projection', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendMessageDraft(ctx.chat.id, 1, 'typing…');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(user.drafts.length).toBe(1);
    expect(user.drafts.lastOrThrow().payload.text).toBe('typing…');
    expect(user.drafts.lastOrThrow().method).toBe('sendMessageDraft');
  });

  it('a streaming sequence of drafts is captured in order', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendRichMessageDraft(ctx.chat.id, 1, { html: '<b>a</b>' });
      await ctx.api.sendRichMessageDraft(ctx.chat.id, 1, { html: '<b>ab</b>' });
      await ctx.api.sendRichMessageDraft(ctx.chat.id, 1, { html: '<b>abc</b>' });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(chats.draftsFor(user).length).toBe(3);

    expect(chats.draftsFor(user).all.map((draft) => (draft.payload.rich_message as { html?: string }).html)).toEqual([
      '<b>a</b>',
      '<b>ab</b>',
      '<b>abc</b>',
    ]);
  });

  it('drafts do not pollute the private chat messages log', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendMessageDraft(ctx.chat.id, 1, 'typing…');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const privateChat = chats.newPrivateChat(user);

    await user.sendText('go');

    expect(privateChat.messages.length).toBe(0);
  });

  it('sendRichMessageDraft resolves with true', async () => {
    const bot = new Bot('test-token');
    let result: unknown;

    bot.on('message:text', async (ctx) => {
      result = await ctx.api.sendRichMessageDraft(ctx.chat.id, 1, { html: '<b>x</b>' });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(result).toBe(true);
  });
});

describe('Bot API 10: guest mode', () => {
  it('sendGuestMessage dispatches a guest_message and returns the query id', async () => {
    const bot = new Bot('test-token');
    let observedFromId: number | undefined;
    let observedQueryId: string | undefined;
    let observedText: string | undefined;

    bot.use((ctx) => {
      const gm = ctx.update.guest_message;

      if (gm) {
        observedFromId = gm.from.id;
        observedQueryId = gm.guest_query_id;
        observedText = gm.text;
      }
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const user = chats.newUser();

    const queryId = await user.sendGuestMessage(group, 'need help');

    expect(queryId).toMatch(/\S/);
    expect(observedQueryId).toBe(queryId);
    expect(observedFromId).toBe(user.id);
    expect(observedText).toBe('need help');
  });

  it('answerGuestQuery returns a synthetic inline_message_id and is not in chat.messages', async () => {
    const bot = new Bot('test-token');
    let answerResult: { inline_message_id?: string } | undefined;

    bot.use(async (ctx) => {
      const gm = ctx.update.guest_message;

      if (gm?.guest_query_id) {
        answerResult = await ctx.api.answerGuestQuery(gm.guest_query_id, ARTICLE);
      }
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const user = chats.newUser();

    await user.sendGuestMessage(group, 'hi');

    expect(answerResult?.inline_message_id).toMatch(/\S/);
    expect(group.messages.length).toBe(0);
  });

  it('correlates the query id to the originating user', async () => {
    const bot = new Bot('test-token');

    bot.use(async (ctx) => {
      const gm = ctx.update.guest_message;

      if (gm?.guest_query_id === undefined) {
        return;
      }

      // Only answer userA's query to exercise correlation on the captured call.
      if (gm.text === 'from-a') {
        await ctx.api.answerGuestQuery(gm.guest_query_id, ARTICLE);
      }
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const userA = chats.newUser();
    const userB = chats.newUser();

    const queryIdA = await userA.sendGuestMessage(group, 'from-a');
    const queryIdB = await userB.sendGuestMessage(group, 'from-b');

    const answers = chats.outgoing.requests.filter((request) => request.method === 'answerGuestQuery');

    expect(answers).toHaveLength(1);
    expect((answers[0]?.payload as { guest_query_id?: string }).guest_query_id).toBe(queryIdA);
    expect(chats.guestQueryUser(queryIdA)?.id).toBe(userA.id);
    expect(chats.guestQueryUser(queryIdB)?.id).toBe(userB.id);
  });
});

describe('Bot API 10: join-request queries', () => {
  it('requestJoin emits and returns a query_id', async () => {
    const bot = new Bot('test-token');
    let observedQueryId: string | undefined;

    bot.on('chat_join_request', (ctx) => {
      observedQueryId = ctx.chatJoinRequest.query_id;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const user = chats.newUser();

    const queryId = await user.requestJoin(group);

    expect(queryId).toMatch(/\S/);
    expect(observedQueryId).toBe(queryId);
  });

  it('answerChatJoinRequestQuery is captured and resolves true', async () => {
    const bot = new Bot('test-token');
    let result: unknown;

    bot.on('chat_join_request', async (ctx) => {
      const queryId = ctx.chatJoinRequest.query_id;

      if (queryId) {
        result = await ctx.api.answerChatJoinRequestQuery(queryId, 'approve');
      }
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const user = chats.newUser();

    await user.requestJoin(group);

    expect(result).toBe(true);
    expect(chats.outgoing.requests.some((request) => request.method === 'answerChatJoinRequestQuery')).toBe(true);
  });
});

describe('Bot API 10: reaction removal', () => {
  it('deleteMessageReaction is recorded with its message_id', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.raw.deleteMessageReaction({ chat_id: ctx.chat.id, message_id: 100 });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(chats.reactionRemovals.length).toBe(1);
    expect(chats.reactionRemovals.lastOrThrow().messageId).toBe(100);
    expect(chats.reactionRemovals.lastOrThrow().method).toBe('deleteMessageReaction');
  });

  it('deleteAllMessageReactions is recorded without a message_id and resolves true', async () => {
    const bot = new Bot('test-token');
    let result: unknown;

    bot.on('message:text', async (ctx) => {
      result = await ctx.api.raw.deleteAllMessageReactions({ chat_id: ctx.chat.id, user_id: 5 });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(result).toBe(true);
    expect(chats.reactionRemovals.lastOrThrow().method).toBe('deleteAllMessageReactions');
    expect(chats.reactionRemovals.lastOrThrow().messageId).toBeUndefined();
  });
});

describe('Bot API 10: managed-bot and personal-chat defaults', () => {
  it('getManagedBotAccessSettings returns a BotAccessSettings-shaped default', async () => {
    const bot = new Bot('test-token');
    let settings: { is_access_restricted?: boolean } | undefined;

    bot.on('message:text', async (ctx) => {
      settings = await ctx.api.getManagedBotAccessSettings(ctx.from.id);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(settings).toBeDefined();
    expect(typeof settings?.is_access_restricted).toBe('boolean');
  });

  it('setManagedBotAccessSettings resolves with true', async () => {
    const bot = new Bot('test-token');
    let result: unknown;

    bot.on('message:text', async (ctx) => {
      result = await ctx.api.setManagedBotAccessSettings(ctx.from.id, true);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(result).toBe(true);
  });

  it('getUserPersonalChatMessages returns an empty array by default', async () => {
    const bot = new Bot('test-token');
    let messages: unknown;

    bot.on('message:text', async (ctx) => {
      messages = await ctx.api.getUserPersonalChatMessages(ctx.from.id, 10);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('go');

    expect(messages).toEqual([]);
  });

  it('getChatAdministrators honors return_bots without dropping human admins', async () => {
    const bot = new Bot('test-token');
    let admins: { user: { is_bot: boolean } }[] | undefined;

    bot.on('message:text', async (ctx) => {
      admins = await ctx.api.raw.getChatAdministrators({ chat_id: ctx.chat.id, return_bots: false });
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const owner = chats.newUser();
    const admin = chats.newUser();

    group.own(owner);
    group.promote(admin);

    await owner.sendText('go', { chat: group });

    expect(admins?.length).toBe(2);
    expect(admins?.every((member) => !member.user.is_bot)).toBe(true);
  });
});
