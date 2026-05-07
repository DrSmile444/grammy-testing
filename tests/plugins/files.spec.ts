/**
 * Plugin interop: `@grammyjs/files`
 *
 * Setup notes:
 * - Install `hydrateFiles(bot.token)` via `bot.api.config.use()` BEFORE calling
 *   `prepareBot`. The library's chain-ordering fix ensures hydrateFiles runs as
 *   an outer transformer and receives the synthetic File response to hydrate.
 * - The default `buildDefaultResponses` entry for `getFile` returns a realistic
 *   File shape ({ file_id, file_unique_id, file_size, file_path }) so hydrateFiles
 *   has something to add getUrl() / download() to without any custom `responses`.
 * - No custom `responses` override is required for basic getFile hydration tests.
 */

import { hydrateFiles } from '@grammyjs/files';
import { Bot, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('plugin: @grammyjs/files', () => {
  it('ctx.getFile() returns a hydrated File with getUrl()', async () => {
    const bot = new Bot<Context>('test-token');

    bot.api.config.use(hydrateFiles(bot.token));

    let fileUrl: string | undefined;

    bot.on('message:document', async (ctx) => {
      const file = await ctx.getFile();

      fileUrl = (file as unknown as { getUrl: () => string }).getUrl();
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendDocument('doc-file-id');

    expect(fileUrl).toBeDefined();
    expect(fileUrl).toMatch(/^https?:\/\//);
  });

  it('default getFile response has realistic File fields', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(hydrateFiles(bot.token));

    let capturedFile: Record<string, unknown> | undefined;

    bot.on('message:document', async (ctx) => {
      capturedFile = (await ctx.getFile()) as unknown as Record<string, unknown>;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendDocument('any-file-id');

    expect(capturedFile?.file_id).toBe('test_file_id');
    expect(capturedFile?.file_unique_id).toBe('test_file_unique_id');
    expect(capturedFile?.file_path).toBe('documents/test_file.pdf');
  });

  it('works without a custom responses override', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(hydrateFiles(bot.token));

    let didThrow = false;

    bot.on('message:document', async (ctx) => {
      try {
        const file = await ctx.getFile();

        (file as unknown as { getUrl: () => string }).getUrl();
      } catch {
        didThrow = true;
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendDocument();

    expect(didThrow).toBe(false);
  });
});
