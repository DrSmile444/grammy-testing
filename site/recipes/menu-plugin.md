# Menu Plugin

Testing [@grammyjs/menu](https://grammy.dev/plugins/menu) with `reply.clickButton()`.

## Key insight

The `@grammyjs/menu` plugin uses an **opaque internal callback_data** format. Don't try to
assert on `reply.buttons[n].callbackData` — it contains an internal identifier. Always match
buttons by their **visible text** label.

## Basic menu test

```ts
import { Menu } from '@grammyjs/menu';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

describe('menu plugin', () => {
  it('triggers the registered handler on click', async () => {
    const bot = new Bot('test-token');
    let handlerRan = false;

    const menu = new Menu('main').text('Click me', async (ctx) => {
      handlerRan = true;
      await ctx.reply('Button clicked!');
    });

    bot.use(menu);
    bot.command('start', async (ctx) => {
      await ctx.reply('Choose:', { reply_markup: menu });
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');
    const reply = user.replies.lastOrThrow();

    expect(reply.text).toBe('Choose:');
    expect(reply.buttons.map((b) => b.text)).toContain('Click me');

    await reply.clickButton('Click me');

    expect(handlerRan).toBe(true);
    expect(user.replies.lastOrThrow().text).toBe('Button clicked!');
  });
});
```

## Multi-button menu

```ts
it('routes to the correct handler', async () => {
  const bot = new Bot('test-token');
  let chosen: string | undefined;

  const menu = new Menu('choice')
    .text('Yes', async (ctx) => {
      chosen = 'yes';
      await ctx.reply('You chose yes');
    })
    .text('No', async (ctx) => {
      chosen = 'no';
      await ctx.reply('You chose no');
    });

  bot.use(menu);
  bot.command('ask', async (ctx) => {
    await ctx.reply('Yes or no?', { reply_markup: menu });
  });

  const { chats } = await prepareBot(bot);
  const user = chats.newUser();

  await user.sendCommand('/ask');
  await user.replies.lastOrThrow().clickButton('No');

  expect(chosen).toBe('no');
  expect(user.replies.lastOrThrow().text).toBe('You chose no');
});
```

## Dynamic menus

For menus that change based on state, assert on the updated reply after the click:

```ts
const menu = new Menu('toggle').text(
  (ctx) => (ctx.session.enabled ? 'Disable' : 'Enable'),
  async (ctx) => {
    ctx.session.enabled = !ctx.session.enabled;
    await ctx.editMessageReplyMarkup({ reply_markup: menu });
  },
);
```

After clicking, check `chats.editsFor(user)` to verify the menu was updated.
