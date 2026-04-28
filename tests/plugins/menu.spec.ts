/**
 * Plugin recipe: `@grammyjs/menu`
 *
 * Pattern: drive a grammY Menu via reply.clickButton(text).
 *
 * Setup notes:
 * - Create a Menu instance, register handlers with menu.text(label, handler).
 * - Install the menu with bot.use(menu) before other handlers.
 * - Send the menu in a handler with ctx.reply("text", { reply_markup: menu }).
 * - reply.clickButton(label) finds the button by visible text and dispatches
 *   the callback_query with whatever callback_data the menu plugin embedded —
 *   the menu's internal data format is transparent to the test.
 *
 * Constraint: the Menu plugin renders buttons with an opaque internal
 * callback_data. Always match by visible button text, not by data.
 */

import { Menu } from '@grammyjs/menu';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('plugin: @grammyjs/menu', () => {
  it('menu button click triggers the registered handler', async () => {
    const bot = new Bot('test-token');
    let handlerRan = false;

    const menu = new Menu('main-menu').text('Click me', async (ctx) => {
      handlerRan = true;
      await ctx.reply('Button clicked!');
    });

    bot.use(menu);

    bot.command('start', async (ctx) => {
      await ctx.reply('Choose:', { reply_markup: menu });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');

    const reply = chats.repliesFor(user).last;

    expect(reply?.text).toBe('Choose:');
    expect(reply?.buttons.map((b) => b.text)).toContain('Click me');

    await reply!.clickButton('Click me');

    expect(handlerRan).toBe(true);
    expect(chats.repliesFor(user).last?.text).toBe('Button clicked!');
  });

  it('multi-button menu routes to the correct handler', async () => {
    const bot = new Bot('test-token');
    let chosen: string | undefined;

    const menu = new Menu('choice-menu')
      .text('Yes', async (ctx) => {
        chosen = 'yes';
        await ctx.reply('You chose yes');
      })
      .text('No', async (ctx) => {
        chosen = 'no';
        await ctx.reply('You chose no');
      });

    bot.use(menu);

    bot.command('ask', async (ctx) => {
      await ctx.reply('Yes or no?', { reply_markup: menu });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/ask');

    const reply = chats.repliesFor(user).last;

    await reply!.clickButton('No');

    expect(chosen).toBe('no');
    expect(chats.repliesFor(user).last?.text).toBe('You chose no');
  });
});
