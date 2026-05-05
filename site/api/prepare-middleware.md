# prepareMiddleware

Initialises a single middleware function for in-process testing. Wraps it in an internal `Bot`
and delegates to `prepareBot`.

## Signature

```ts
async function prepareMiddleware<TContext extends Context = Context>(
  middleware: Middleware<TContext>,
  options?: PrepareWithConstructorOptions<TContext>,
): Promise<PrepareMiddlewareReturn<TContext>>;
```

## Parameters

| Parameter    | Type                                      | Description                                      |
| ------------ | ----------------------------------------- | ------------------------------------------------ |
| `middleware` | `Middleware<TContext>`                    | The middleware under test (`(ctx, next) => ...`) |
| `options`    | `PrepareWithConstructorOptions<TContext>` | Same options as `prepareComposer`                |

## Return value

```ts
interface PrepareMiddlewareReturn<TContext extends Context = Context> {
  chats: Chats<TContext>;
}
```

## Example — rate limiter

```ts
import { prepareMiddleware } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

// Rate limiter middleware
const rateLimiter = (windowMs: number, maxRequests: number) => {
  const counts = new Map<number, number>();
  return async (ctx: Context, next: NextFunction) => {
    const id = ctx.from?.id ?? 0;
    const count = (counts.get(id) ?? 0) + 1;
    counts.set(id, count);
    if (count > maxRequests) {
      await ctx.reply('Rate limited!');
      return;
    }
    await next();
  };
};

describe('rate limiter', () => {
  it('allows requests under the limit', async () => {
    const { chats } = await prepareMiddleware(rateLimiter(60_000, 3));
    const user = chats.newUser();

    await user.sendText('1');
    await user.sendText('2');
    await user.sendText('3');

    expect(user.replies.length).toBe(0); // middleware passed through, no reply from it
  });

  it('blocks requests over the limit', async () => {
    const { chats } = await prepareMiddleware(rateLimiter(60_000, 3));
    const user = chats.newUser();

    await user.sendText('1');
    await user.sendText('2');
    await user.sendText('3');
    await user.sendText('4'); // over limit

    expect(user.replies.lastOrThrow().text).toBe('Rate limited!');
  });
});
```

## See also

- [`prepareComposer`](/api/prepare-composer) — for testing a `Composer`
- [`prepareBot`](/api/prepare-bot) — for testing a full assembled bot
