# With Deno

::: tip Third-party release
`grammy-testing` is currently published to **npm only**. Native Deno/JSR support — a `jsr:` import
and a `deno.json` entry — will arrive when the library migrates to the official `@grammyjs/testing`
package. Until then, Deno consumes it through the `npm:` specifier.
:::

## Import

Deno can import the package directly from npm using the `npm:` specifier — no `npm install` or
`node_modules` required:

```ts
import { prepareBot } from 'npm:grammy-testing';
import { Bot } from 'npm:grammy';
```

## Writing tests

Use `Deno.test` with the standard `assert` helpers, or bring in any assertion library:

```ts
// bot.test.ts
import { prepareBot } from 'npm:grammy-testing';
import { Bot } from 'npm:grammy';
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
import { GenericMockUpdate } from 'npm:grammy-testing/low-level';
```

## Notes

- All TypeScript types are included — no separate `@types` package needed.
- When the official `@grammyjs/testing` release lands, this page will switch to the `jsr:` import.
