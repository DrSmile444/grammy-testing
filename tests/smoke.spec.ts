import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../src/index';
import { LeftMemberMockUpdate, MessagePrivateMockUpdate, NewMemberMockUpdate } from '../src/low-level';

describe('smoke: real-bot patterns from the inspiration corpus', () => {
  it('Pattern 6: private command with bot_command entity', async () => {
    const bot = new Bot('test-token');
    let invoked = false;

    bot.command('language', async (context) => {
      invoked = true;
      await context.reply('language menu');
    });

    const { chats } = await prepareBot(bot);

    const update = new MessagePrivateMockUpdate('/language').buildOverwrite({
      message: {
        entities: [{ offset: 0, length: 9, type: 'bot_command' }],
      },
    });

    await bot.handleUpdate(update);

    expect(invoked).toBe(true);
    expect(chats.outgoing.getMethods()).toEqual(['sendMessage']);

    expect(chats.outgoing.getLast()?.payload).toMatchObject({
      text: 'language menu',
    });
  });

  it('Pattern 8: join service message', async () => {
    const bot = new Bot('test-token');

    bot.on('message:new_chat_members', async (context) => {
      await context.deleteMessage();
    });

    const { chats } = await prepareBot(bot);

    await bot.handleUpdate(new NewMemberMockUpdate().build());

    expect(chats.outgoing.getMethods()).toEqual(['deleteMessage']);
  });

  it('Pattern 8: leave service message', async () => {
    const bot = new Bot('test-token');

    bot.on('message:left_chat_member', async (context) => {
      await context.deleteMessage();
    });

    const { chats } = await prepareBot(bot);

    await bot.handleUpdate(new LeftMemberMockUpdate().build());

    expect(chats.outgoing.getMethods()).toEqual(['deleteMessage']);
  });
});
