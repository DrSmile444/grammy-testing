/**
 * Pattern: prepareComposer / prepareMiddleware with a class-based custom context.
 *
 * Covers the ContextConstructor option added in v0.5.0.
 */

import { Composer, Context, type MiddlewareFn } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareComposer, prepareMiddleware } from '../../src/index';

class CustomCtx extends Context {
  readonly tag = 'custom';
}

describe('reference: ContextConstructor option', () => {
  describe('prepareComposer', () => {
    it('instantiates the custom context class when ContextConstructor is provided', async () => {
      const composer = new Composer<CustomCtx>();
      let observed: string | undefined;

      composer.on('message:text', (ctx) => {
        observed = ctx.tag;
      });

      const { chats } = await prepareComposer(composer, { ContextConstructor: CustomCtx });
      const user = chats.newUser();
      await user.sendText('hi');

      expect(observed).toBe('custom');
    });

    it('preserves existing behavior when ContextConstructor is omitted', async () => {
      const composer = new Composer<Context>();
      let reached = false;

      composer.on('message:text', () => {
        reached = true;
      });

      const { chats } = await prepareComposer(composer);
      const user = chats.newUser();
      await user.sendText('hi');

      expect(reached).toBe(true);
    });

    it('responses option still works alongside ContextConstructor', async () => {
      const composer = new Composer<CustomCtx>();
      let tagSeen: string | undefined;
      let replySent = false;

      composer.on('message:text', async (ctx) => {
        tagSeen = ctx.tag;
        await ctx.reply('pong');
        replySent = true;
      });

      // Pass a responses override alongside ContextConstructor — both must apply
      const { chats } = await prepareComposer(composer, {
        ContextConstructor: CustomCtx,
        responses: {},
      });
      const user = chats.newUser();
      await user.sendText('hi');

      expect(tagSeen).toBe('custom');
      expect(replySent).toBe(true);
      expect(chats.repliesFor(user).last?.text).toBe('pong');
    });
  });

  describe('prepareMiddleware', () => {
    it('instantiates the custom context class when ContextConstructor is provided', async () => {
      let observed: string | undefined;

      const middleware: MiddlewareFn<CustomCtx> = (ctx) => {
        observed = ctx.tag;
      };

      const { chats } = await prepareMiddleware(middleware, { ContextConstructor: CustomCtx });
      const user = chats.newUser();
      await user.sendText('hi');

      expect(observed).toBe('custom');
    });

    it('preserves existing behavior when ContextConstructor is omitted', async () => {
      let reached = false;

      const middleware: MiddlewareFn = () => {
        reached = true;
      };

      const { chats } = await prepareMiddleware(middleware);
      const user = chats.newUser();
      await user.sendText('hi');

      expect(reached).toBe(true);
    });
  });
});
