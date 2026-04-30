/**
 * Pattern: Menu flows (inline keyboard click → callback_query).
 *
 * Source: ua-anti-spam-bot has limited menu flows but the pattern is
 *         pervasive across grammY bots; the audit list calls out
 *         clickButton coverage as a "major DX win" for menu-driven bots.
 * Inspired-by tests: pattern-driven, ~10–20 in typical menu-bot suites
 *
 * What this exercises: bot replies with an inline keyboard, user clicks
 * a button, the resulting callback_query update is dispatched and the
 * bot's callback handler runs. Includes chained-keyboard flows where
 * the callback handler replies with a new keyboard.
 *
 * v0.2 API expression: reply.clickButton(textOrSpec). The Reply object
 * is obtained from chats.repliesFor(user).last after the bot replies
 * with an inline keyboard.
 *
 * v0.2.x gaps: none for this pattern category at v0.2.
 */

import assert from 'node:assert';

import { Bot, InlineKeyboard } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: menu flows', () => {
  it('basic flow: reply with keyboard, user clicks, callback handler runs', async () => {
    const bot = new Bot('test-token');
    let didAck = false;

    bot.command('start', async (context) => {
      const kb = new InlineKeyboard().text('Yes', 'cb-yes').text('No', 'cb-no');

      await context.reply('proceed?', { reply_markup: kb });
    });

    bot.on('callback_query:data', async (context) => {
      if (context.callbackQuery.data === 'cb-yes') {
        didAck = true;
        await context.reply('proceeding');
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');

    const reply = chats.repliesFor(user).last;

    assert.ok(reply);

    expect(reply.buttons.map((button) => button.text)).toEqual(['Yes', 'No']);

    await reply.clickButton('Yes');

    expect(didAck).toBe(true);
    expect(chats.repliesFor(user).last?.text).toBe('proceeding');
  });

  it('chained keyboards: each click reveals a new keyboard, terminal click resolves', async () => {
    const bot = new Bot('test-token');
    let finalChoice: string | undefined;

    bot.command('start', async (context) => {
      const kb = new InlineKeyboard().text('Start', 'cb-start');

      await context.reply('begin?', { reply_markup: kb });
    });

    bot.on('callback_query:data', async (context) => {
      const { data } = context.callbackQuery;

      if (data === 'cb-start') {
        const kb = new InlineKeyboard().text('Option A', 'cb-a').text('Option B', 'cb-b');

        await context.reply('pick:', { reply_markup: kb });

        return;
      }

      if (data === 'cb-a' || data === 'cb-b') {
        finalChoice = data;
        await context.reply(`chose ${data}`);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');

    const first = chats.repliesFor(user).last;

    assert.ok(first);

    await first.clickButton('Start');

    const second = chats.repliesFor(user).last;

    assert.ok(second);

    expect(second.buttons.map((button) => button.text)).toEqual(['Option A', 'Option B']);

    await second.clickButton('Option A');

    expect(finalChoice).toBe('cb-a');
    expect(chats.repliesFor(user).last?.text).toBe('chose cb-a');
  });

  it('match by callback_data spec when text is dynamic', async () => {
    const bot = new Bot('test-token');
    let dataObserved: string | undefined;

    bot.command('start', async (context) => {
      // Dynamic text — could be a localized label, a username, etc.
      const kb = new InlineKeyboard().text(`Hello, ${context.from?.username ?? 'friend'}!`, 'cb-greet');

      await context.reply('greeting:', { reply_markup: kb });
    });

    bot.on('callback_query:data', (context) => {
      dataObserved = context.callbackQuery.data;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser({ username: 'alice' });

    await user.sendCommand('/start');

    const reply = chats.repliesFor(user).last;

    assert.ok(reply);

    await reply.clickButton({ callbackData: 'cb-greet' });

    expect(dataObserved).toBe('cb-greet');
  });

  it('URL-only button rejects clickButton with a clear error', async () => {
    const bot = new Bot('test-token');

    bot.command('start', async (context) => {
      const kb = new InlineKeyboard().url('Open', 'https://example.com');

      await context.reply('go:', { reply_markup: kb });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');

    const reply = chats.repliesFor(user).last;

    assert.ok(reply);

    await expect(reply.clickButton('Open')).rejects.toThrow(/URL buttons/);
  });
});
