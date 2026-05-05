# With Deno

grammY Testing is published to [JSR](https://jsr.io/@grammyjs/testing) and works with Deno natively.

## Import

```ts
import { prepareBot } from 'jsr:@grammyjs/testing';
import { Bot } from 'jsr:@grammyjs/grammy';
```

Or pin to a version:

```ts
import { prepareBot } from 'jsr:@grammyjs/testing@^0.21.0';
```

## deno.json configuration

```json
{
  "imports": {
    "@grammyjs/testing": "jsr:@grammyjs/testing",
    "grammy": "jsr:@grammyjs/grammy"
  }
}
```

Then import by name:

```ts
import { prepareBot } from '@grammyjs/testing';
```

## Writing tests

Use `Deno.test` with the standard `assert` helpers, or bring in any assertion library:

```ts
// bot.test.ts
import { prepareBot } from 'jsr:@grammyjs/testing';
import { Bot } from 'jsr:@grammyjs/grammy';
import { assertEquals } from 'jsr:@std/assert';

Deno.test('replies to /start', async () => {
  const bot = new Bot('token');

  bot.command('start', (ctx) => ctx.reply('Welcome!'));

  const { chats } = await prepareBot(bot);
  const user = chats.newUser();

  await user.sendCommand('/start');

  assertEquals(user.replies.lastOrThrow().text, 'Welcome!');
});
```

Run:

```sh
deno test --allow-env
```

## Low-level subpath

The low-level update builders are exported from a separate subpath:

```ts
import { GenericMockUpdate } from 'jsr:@grammyjs/testing/low-level';
```

## Notes

- Deno resolves JSR packages from `jsr.json` at the repo root, which mirrors `package.json` versioning.
- No `npm install` or `node_modules` required.
- All TypeScript types are included — no separate `@types` package needed.
