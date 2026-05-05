# prepareComposer

Initialises a single `Composer` for in-process testing. Wraps it in an internal `Bot` and
delegates to `prepareBot`.

## Signature

```ts
async function prepareComposer<TContext extends Context = Context>(
  composer: Composer<TContext>,
  options?: PrepareWithConstructorOptions<TContext>,
): Promise<PrepareComposerReturn<TContext>>;
```

## Parameters

| Parameter  | Type                                      | Description             |
| ---------- | ----------------------------------------- | ----------------------- |
| `composer` | `Composer<TContext>`                      | The composer under test |
| `options`  | `PrepareWithConstructorOptions<TContext>` | Optional configuration  |

## PrepareWithConstructorOptions

Extends `PrepareOptions` with two additional fields:

```ts
interface PrepareWithConstructorOptions<TContext extends Context = Context> extends PrepareOptions {
  contextConstructor?: new (...args: ConstructorParameters<typeof Context>) => TContext;
  state?: TContext extends StateContext<infer TState> ? Partial<TState> : never;
}
```

| Field                | Type                      | Description                                        |
| -------------------- | ------------------------- | -------------------------------------------------- |
| `responses`          | `Responses`               | Canned responses (inherited from `PrepareOptions`) |
| `contextConstructor` | `typeof Context` subclass | Custom context class                               |
| `state`              | `Partial<TState>`         | Pre-populated `ctx.state` for every update         |

## Return value

```ts
interface PrepareComposerReturn<TContext extends Context = Context> {
  chats: Chats<TContext>;
}
```

## Example — basic composer

```ts
import { prepareComposer } from '@grammyjs/testing';
import { Composer } from 'grammy';

const composer = new Composer();

composer.command('ping', (ctx) => ctx.reply('pong'));

const { chats } = await prepareComposer(composer);
const user = chats.newUser();

await user.sendCommand('/ping');
expect(user.replies.lastOrThrow().text).toBe('pong');
```

## Example — custom context + state

```ts
import { prepareComposer } from '@grammyjs/testing';
import { Composer, Context } from 'grammy';

interface MyState {
  role: 'admin' | 'user';
}
class MyContext extends Context {
  state!: MyState;
}

const composer = new Composer<MyContext>();

composer.command('admin', async (ctx) => {
  if (ctx.state.role !== 'admin') {
    await ctx.reply('Forbidden');
    return;
  }
  await ctx.reply('Welcome, admin!');
});

const { chats } = await prepareComposer<MyContext>(composer, {
  contextConstructor: MyContext,
  state: { role: 'admin' },
});

const user = chats.newUser();
await user.sendCommand('/admin');
expect(user.replies.lastOrThrow().text).toBe('Welcome, admin!');
```

## See also

- [`prepareBot`](/api/prepare-bot) — for testing a full assembled bot
- [`prepareMiddleware`](/api/prepare-middleware) — for testing a single middleware function
