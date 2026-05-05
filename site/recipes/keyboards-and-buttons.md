# Keyboards & Buttons

## Inline keyboard

**Bot:**

```ts
import { Bot, InlineKeyboard } from 'grammy';

export function createBot() {
  const bot = new Bot('token');

  bot.command('menu', async (ctx) => {
    const keyboard = new InlineKeyboard().text('Yes', 'answer:yes').text('No', 'answer:no');

    await ctx.reply('Do you like grammY?', { reply_markup: keyboard });
  });

  bot.callbackQuery('answer:yes', async (ctx) => {
    await ctx.editMessageText('Great choice!');
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery('answer:no', async (ctx) => {
    await ctx.editMessageText('Give it a try!');
    await ctx.answerCallbackQuery();
  });

  return bot;
}
```

**Test:**

```ts
import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

describe('inline keyboard', () => {
  it('sends a keyboard with two buttons', async () => {
    const { chats } = await prepareBot(createBot());
    const user = chats.newUser();

    await user.sendCommand('/menu');

    const reply = user.replies.lastOrThrow();

    expect(reply.text).toBe('Do you like grammY?');
    expect(reply.buttons).toHaveLength(2);
    expect(reply.buttons[0].text).toBe('Yes');
    expect(reply.buttons[1].text).toBe('No');
  });

  it('edits the message when Yes is clicked', async () => {
    const { chats } = await prepareBot(createBot());
    const user = chats.newUser();

    await user.sendCommand('/menu');
    const reply = user.replies.lastOrThrow();

    await reply.clickButton('Yes');

    expect(chats.editsFor(user).lastOrThrow().text).toBe('Great choice!');
  });

  it('each button has callback_data', async () => {
    const { chats } = await prepareBot(createBot());
    const user = chats.newUser();

    await user.sendCommand('/menu');
    const reply = user.replies.lastOrThrow();

    expect(reply.buttons[0].callbackData).toBe('answer:yes');
    expect(reply.buttons[1].callbackData).toBe('answer:no');
  });
});
```

## clickButton by callback data

```ts
// By visible text (default, recommended):
await reply.clickButton('Yes');

// By callback_data explicitly:
await reply.clickButton({ callbackData: 'answer:yes' });
```

## Asserting on button structure

```ts
const reply = user.replies.lastOrThrow();

// All buttons
console.log(reply.buttons.map((b) => b.text)); // ['Yes', 'No']

// Check URL buttons
const urlButton = reply.buttons.find((b) => b.url);
expect(urlButton?.url).toBe('https://grammy.dev');

// Access raw InlineKeyboardButton for unusual fields
expect(reply.buttons[0].raw.switch_inline_query).toBeUndefined();
```
