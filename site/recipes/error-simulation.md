# Error Simulation

## failNext — one-shot error

Forces the next call to a specific API method to reject with a `GrammyError`. After firing once,
subsequent calls revert to normal.

```ts
import { GrammyError, prepareBot } from '@grammyjs/testing';

const { chats } = await prepareBot(createBot());
const user = chats.newUser();

// Tell the transformer: the next sendMessage should throw 403
chats.outgoing.failNext('sendMessage', {
  code: 403,
  description: 'Forbidden: bot was blocked by the user',
});

// Bot tries to send a message, gets a GrammyError
await user.sendText('trigger');
// The bot's error handler should run now

// Recovery: the next call goes through normally
await user.sendText('again');
expect(user.replies.lastOrThrow().text).toBe('...');
```

## failAll — sticky error

Forces **every** call to a method to fail until `clearOverrides()` is called.

```ts
chats.outgoing.failAll('getChatMember', {
  code: 400,
  description: 'Bad Request: chat not found',
});

// Multiple dispatches — all getChatMember calls fail
await user.sendCommand('/check');
await user.sendCommand('/verify');

// Remove the sticky failure
chats.outgoing.clearOverrides();

// Now succeeds
await user.sendCommand('/check');
```

## Testing your bot's error handler

```ts
import { GrammyError } from 'grammy'; // also re-exported from @grammyjs/testing

const bot = new Bot('token');

bot.catch(async (err) => {
  if (err.error instanceof GrammyError && err.error.error_code === 403) {
    // handle blocked user
  }
});

bot.command('notify', async (ctx) => {
  await ctx.reply('Notification sent!');
});

const { chats } = await prepareBot(bot);
const user = chats.newUser();

chats.outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden' });
await user.sendCommand('/notify');

// Assert the error path ran (e.g. via a flag set in the error handler)
expect(errorHandlerRan).toBe(true);
```

## Combining failNext with respondNext

```ts
// Make the first call succeed with a specific value:
chats.outgoing.respondNext('getChatMember', { status: 'kicked' });

// Make the second call fail:
chats.outgoing.failNext('getChatMember', { code: 403, description: 'Forbidden' });
```

## GrammyErrorSpec

Both `failNext` and `failAll` accept either a real `GrammyError` or a shorthand spec:

```ts
// Shorthand:
{ code: 403, description: 'Forbidden: ...' }

// Real GrammyError (e.g. to set extra fields):
import { GrammyError } from '@grammyjs/testing';
const err = new GrammyError('...', { error_code: 403, description: '...', ok: false }, 'sendMessage', {});
chats.outgoing.failNext('sendMessage', err);
```
