# Session Mocking

The mock helpers let you inject pre-set session/state values into a bot's context without needing
real storage middleware.

## mockSession

Mocks `ctx.session` for per-user session state.

```ts
import { mockSession, prepareBot } from 'grammy-testing';
import { Bot } from 'grammy';

interface MySession {
  count: number;
}

const { session, mockSessionMiddleware } = mockSession<MySession, MyContext>({ count: 0 });

const bot = new Bot<MyContext>('token');
bot.use(mockSessionMiddleware); // install before your handlers

bot.command('count', async (ctx) => {
  ctx.session.count += 1;
  await ctx.reply(`Count: ${ctx.session.count}`);
});

const { chats } = await prepareBot(bot);
const user = chats.newUser();

await user.sendCommand('/count');
await user.sendCommand('/count');

expect(user.replies.lastOrThrow().text).toBe('Count: 2');
expect(session.count).toBe(2); // mutate or read directly
```

The `session` object is the **same mutable reference** injected into `ctx.session`. You can
read and write it directly in your test.

## mockChatSession

Mocks `ctx.chatSession` for per-chat session state.

```ts
interface ChatSettings {
  language: string;
}

const { chatSession, mockChatSessionMiddleware } = mockChatSession<ChatSettings, MyContext>({
  language: 'en',
});

bot.use(mockChatSessionMiddleware);
```

## mockState

Pre-populates `ctx.state` before every handler invocation. Available via `prepareComposer` and
`prepareMiddleware` options, or manually:

```ts
import { mockState } from 'grammy-testing';

interface MyState {
  isAdmin: boolean;
}

const { state, mockStateMiddleware } = mockState<MyState, MyContext>({ isAdmin: true });
bot.use(mockStateMiddleware);

// Or via prepareComposer:
const { chats } = await prepareComposer(composer, {
  state: { isAdmin: true },
});
```

## mockContextField

Generic helper for mocking any context field. The specialised helpers above are built on it.

```ts
import { mockContextField } from 'grammy-testing';

interface MyContext extends Context {
  premium: boolean;
}

const { mocked, middleware } = mockContextField<MyContext, 'premium'>('premium', true);

bot.use(middleware);
// ctx.premium === true for every update
```

## Combining with real session middleware

You can use `mockSession` alongside grammY's real `session()` middleware to pre-seed state
while keeping real per-chat storage:

```ts
const { mockSessionMiddleware } = mockSession({ count: 5 });
bot.use(mockSessionMiddleware); // runs first — seeds state
// ... bot.use(session({ ... })) would override this
```

Or skip `mockSession` entirely and use grammY's `session()` with an in-memory adapter — both
approaches work fine with grammY Testing.
