import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createInlineKeyboardBot } from './bot';

describe('inline-keyboard-bot', () => {
  it('sends a keyboard with Yes and No buttons on /menu', async () => {
    const { chats } = await prepareBot(createInlineKeyboardBot());
    const user = chats.newUser();

    await user.sendCommand('/menu');

    const reply = user.replies.lastOrThrow();

    expect(reply.text).toBe('Do you like grammY?');
    expect(reply.buttons).toHaveLength(2);
    expect(reply.buttons[0]?.text).toBe('Yes');
    expect(reply.buttons[1]?.text).toBe('No');
  });

  it('edits the message when Yes is clicked', async () => {
    const { chats } = await prepareBot(createInlineKeyboardBot());
    const user = chats.newUser();

    await user.sendCommand('/menu');
    const reply = user.replies.lastOrThrow();

    await reply.clickButton('Yes');

    expect(chats.editsFor(user).lastOrThrow().text).toBe('Great choice!');
  });

  it('edits the message when No is clicked', async () => {
    const { chats } = await prepareBot(createInlineKeyboardBot());
    const user = chats.newUser();

    await user.sendCommand('/menu');
    const reply = user.replies.lastOrThrow();

    await reply.clickButton('No');

    expect(chats.editsFor(user).lastOrThrow().text).toBe('Give it a try!');
  });

  it('each button has a callback_data', async () => {
    const { chats } = await prepareBot(createInlineKeyboardBot());
    const user = chats.newUser();

    await user.sendCommand('/menu');

    const reply = user.replies.lastOrThrow();

    expect(reply.buttons[0]?.callbackData).toBe('answer:yes');
    expect(reply.buttons[1]?.callbackData).toBe('answer:no');
  });
});
