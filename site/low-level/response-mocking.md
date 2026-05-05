# Response Mocking

By default, every Telegram API call your bot makes resolves to `{ ok: true, result: true }`. You
can override the response for any method globally (via `prepareBot` options) or per-call (via
`chats.outgoing.respondNext`).

## Static responses via prepareBot

Pass a `responses` map to provide fixed return values for specific methods:

```ts
const { chats } = await prepareBot(bot, {
  responses: {
    getChat: {
      id: -100123456,
      type: 'supergroup',
      title: 'Production Group',
    },
    getChatMember: {
      status: 'administrator',
      user: { id: 99, is_bot: false, first_name: 'Alice' },
      can_delete_messages: true,
    },
  },
});
```

## Dynamic responses via prepareBot

Use a function to return a response based on the request payload:

```ts
const { chats } = await prepareBot(bot, {
  responses: {
    getChatMember: (payload) => ({
      status: payload.user_id === adminId ? 'administrator' : 'member',
      user: { id: payload.user_id, is_bot: false, first_name: 'User' },
    }),
  },
});
```

## Per-call override via respondNext

Use `chats.outgoing.respondNext` to override the response for only the next call to a method:

```ts
chats.outgoing.respondNext('getChat', {
  id: -100999,
  type: 'channel',
  title: 'Override Channel',
});

await user.sendCommand('/info'); // bot calls getChat → gets the override
// Next getChat call uses the default or static response
```

## ResponseResolver type

```ts
type ResponseResolver<TMethod extends Methods> =
  | Partial<Result<TMethod>>
  | ((payload: Payload<TMethod>, method: TMethod) => Partial<Result<TMethod>> | Promise<Partial<Result<TMethod>>>);

type Responses = {
  [M in Methods]?: ResponseResolver<M>;
};
```

- `Partial<Result<TMethod>>` — a static value. Merged with the default `{ ok: true }` wrapper.
- `(payload, method) => ...` — a function that receives the outgoing payload and returns a result.
  May be async.

## Default responses

For most methods, the default response is `{ ok: true, result: true }`. For methods that return
a `Message` object (e.g. `sendMessage`), the library synthesises a minimal valid Message with a
real `message_id` so that reply-chain tracking works correctly.

You only need to override a method's response when your bot's logic branches on the returned
value (e.g. checking `getChatMember.status`, reading `getChat.title`).
