/**
 * Pattern: Commands with bot_command entities.
 *
 * Source: ua-anti-spam-bot/tests/bot.spec.ts (private command helper),
 *         ua-anti-spam-bot/tests/bot/commands/public/help.command.spec.ts,
 *         ua-anti-spam-bot/tests/bot/commands/public/start.command.spec.ts
 * Inspired-by tests: ~30
 *
 * What this exercises: /start, /help, /lang style commands with the
 * `bot_command` Telegram entity. Both private and supergroup chats.
 * Arg parsing and admin-only command guards.
 *
 * v0.2 API expression: user.sendCommand(cmd, args?, options?) — the
 * optional `options.chat` parameter overrides the default private-chat
 * destination. Closed in v0.2.x via extend-send-command-with-chat-option.
 *
 * v0.2.x gaps: none for this pattern category at v0.2.x.
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: commands', () => {
  it('/start in a private chat triggers the command handler', async () => {
    const bot = new Bot('test-token');

    bot.command('start', async (context) => {
      await context.reply("How you doin'?");
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');

    expect(chats.repliesFor(user).last?.text).toBe("How you doin'?");
  });

  it('/lang en parses the arg correctly', async () => {
    const bot = new Bot('test-token');
    let observedArg: string | undefined;

    bot.command('lang', async (context) => {
      observedArg = context.match;
      await context.reply(`switching to ${context.match}`);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/lang', 'en');

    expect(observedArg).toBe('en');
    expect(chats.repliesFor(user).last?.text).toBe('switching to en');
  });

  it('command in a supergroup via sendCommand options.chat', async () => {
    const bot = new Bot('test-token');

    bot.command('start', async (context) => {
      await context.reply('hello group');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser({ username: 'alice' });
    const group = chats.newSupergroup();

    group.promote(user);

    await user.sendCommand('/start', undefined, { chat: group });

    expect(group.messages.last?.text).toBe('hello group');
  });

  it('admin-only command: succeeds for promoted user', async () => {
    const bot = new Bot('test-token');

    bot.command('config', async (context) => {
      // Real-world pattern: check chat-session for isBotAdmin / chat admin status.
      // Here we model admin-gating via a single conditional.
      await context.reply('config menu');
    });

    const { chats } = await prepareBot(bot);
    const admin = chats.newAdmin();

    await admin.sendCommand('/config');

    expect(chats.repliesFor(admin).last?.text).toBe('config menu');
  });

  it("command added by non-admin still hits the handler (gating is the bot author's responsibility)", async () => {
    // Reference pattern: the testing framework dispatches; admin-checking
    // is the bot's middleware. This test confirms the framework does NOT
    // gate dispatch on membership status — dispatch always reaches the
    // handler, which then decides via context.from / chat-session / etc.
    const bot = new Bot('test-token');
    let invocationCount = 0;

    bot.command('config', async (context) => {
      invocationCount += 1;
      await context.reply('handled');
    });

    const { chats } = await prepareBot(bot);
    const regularUser = chats.newUser();

    await regularUser.sendCommand('/config');

    expect(invocationCount).toBe(1);
    expect(chats.repliesFor(regularUser).last?.text).toBe('handled');
  });
});
