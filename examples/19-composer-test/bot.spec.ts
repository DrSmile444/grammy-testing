import { prepareComposer } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createLanguagePickerComposer, SUPPORTED_LANGUAGES } from './bot';

describe('composer-test (language picker)', () => {
  it('sends a language picker keyboard on /language', async () => {
    const { chats } = await prepareComposer(createLanguagePickerComposer());
    const user = chats.newUser();

    await user.sendCommand('/language');

    const reply = user.replies.lastOrThrow();

    expect(reply.text).toBe('Select your language:');
    expect(reply.buttons).toHaveLength(SUPPORTED_LANGUAGES.length);
  });

  it('each button has the correct label', async () => {
    const { chats } = await prepareComposer(createLanguagePickerComposer());
    const user = chats.newUser();

    await user.sendCommand('/language');

    const reply = user.replies.lastOrThrow();
    const buttonLabels = reply.buttons.map((button) => button.text);

    expect(buttonLabels).toContain('English');
    expect(buttonLabels).toContain('Ukrainian');
    expect(buttonLabels).toContain('German');
  });

  it('edits the message when a language button is clicked', async () => {
    const { chats } = await prepareComposer(createLanguagePickerComposer());
    const user = chats.newUser();

    await user.sendCommand('/language');
    const reply = user.replies.lastOrThrow();

    await reply.clickButton('English');

    expect(chats.editsFor(user).lastOrThrow().text).toBe('Language set to: English');
  });

  it('works in isolation without a full Bot instance', async () => {
    const { chats } = await prepareComposer(createLanguagePickerComposer());

    expect(chats.outgoing).toBeDefined();
    expect(typeof chats.newUser).toBe('function');
  });

  it('handles an unknown language callback gracefully', async () => {
    const { chats } = await prepareComposer(createLanguagePickerComposer());
    const user = chats.newUser();

    await user.sendCallbackQuery('lang:xx');

    const answerCall = chats.outgoing.requests.find((request) => request.method === 'answerCallbackQuery');

    expect(answerCall).toBeDefined();
    expect((answerCall?.payload as { text: string }).text).toBe('Unknown language');
  });
});
