/**
 * Plugin recipe: `@grammyjs/parse-mode` v2
 *
 * Pattern: verify formatted text and entities are captured correctly.
 *
 * Setup notes:
 * - `@grammyjs/parse-mode` v2 provides declarative formatting helpers (fmt, b, i,
 *   u, etc.) used as tagged template literal markers: fmt`${b}text${b}`.
 * - No middleware installation required. Import helpers and use them directly.
 * - The plugin is transparent to the testing framework: every outgoing
 *   sendMessage call is captured normally. reply.text and reply.entities
 *   expose the values produced by the plugin.
 * - reply.parseMode remains undefined when using entities-based formatting
 *   (entities vs. HTML/MarkdownV2 parse_mode strings).
 *
 * Note: `@grammyjs/hydrate` adds methods to ctx objects that proxy to the API.
 * Testing it is identical to testing ctx.deleteMessage() — the captured
 * outgoing method name is the same. No separate test file is needed.
 */

import { b, fmt, i } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('plugin: @grammyjs/parse-mode', () => {
  it('fmt with bold marker produces correct text and entity', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const formatted = fmt`${b}Hello${b}, world!`;

      await ctx.reply(formatted.text, { entities: formatted.entities });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    const reply = chats.repliesFor(user).last;

    expect(reply?.text).toBe('Hello, world!');
    expect(reply?.entities?.some((entity) => entity.type === 'bold')).toBe(true);
  });

  it('fmt with multiple markers produces merged entities', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const formatted = fmt`${b}Important${b}: ${i}note${i}`;

      await ctx.reply(formatted.text, { entities: formatted.entities });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    const reply = chats.repliesFor(user).last;

    expect(reply?.text).toBe('Important: note');

    const types = reply?.entities?.map((entity) => entity.type);

    expect(types).toContain('bold');
    expect(types).toContain('italic');
  });
});
