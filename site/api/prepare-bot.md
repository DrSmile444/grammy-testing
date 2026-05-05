# prepareBot

Initialises a `Bot` for in-process testing.

## Signature

```ts
async function prepareBot<TContext extends Context = Context, TApi extends Api = Api>(
  bot: Bot<TContext, TApi>,
  options?: PrepareOptions,
): Promise<PrepareBotReturn<TContext>>;
```

## Parameters

| Parameter | Type                  | Description               |
| --------- | --------------------- | ------------------------- |
| `bot`     | `Bot<TContext, TApi>` | The grammY bot under test |
| `options` | `PrepareOptions`      | Optional configuration    |

## PrepareOptions

```ts
interface PrepareOptions {
  responses?: Responses;
  warnOnUnregisteredChats?: boolean;
}
```

| Field                     | Type        | Default | Description                                                                      |
| ------------------------- | ----------- | ------- | -------------------------------------------------------------------------------- |
| `responses`               | `Responses` | `{}`    | Map of API method → canned response. Methods not listed resolve to `true`.       |
| `warnOnUnregisteredChats` | `boolean`   | `true`  | Emits a `console.warn` when the bot sends to a chat not registered with `Chats`. |

## Return value

```ts
interface PrepareBotReturn<TContext extends Context = Context> {
  chats: Chats<TContext>;
}
```

## What it does

1. Creates `OutgoingRequests`, `IdleTracker`, and `Chats` instances.
2. Builds default canned responses and merges in `options.responses`.
3. Installs the capture transformer on `bot.api`.
4. Pre-populates `bot.botInfo` with a generic fixture (skips `getMe`).
5. Awaits `bot.init()`.
6. Wires the bot reference into the `Chats` orchestrator.

## Example

```ts
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

const bot = new Bot('token');
bot.command('start', (ctx) => ctx.reply('Hello!'));

const { chats } = await prepareBot(bot);
const user = chats.newUser();

await user.sendCommand('/start');
expect(user.replies.lastOrThrow().text).toBe('Hello!');
```

## With responses

```ts
const { chats } = await prepareBot(bot, {
  responses: {
    getChatMember: { status: 'administrator', user: { id: 1, is_bot: false, first_name: 'Alice' } },
  },
});
```

## See also

- [`prepareComposer`](/api/prepare-composer) — for testing a `Composer` in isolation
- [`prepareMiddleware`](/api/prepare-middleware) — for testing a single middleware
- [Response Mocking](/low-level/response-mocking) — full responses documentation
