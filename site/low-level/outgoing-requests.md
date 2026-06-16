# Outgoing Requests

`OutgoingRequests` stores every API call your bot makes during a test. It's available at
`chats.outgoing`.

## Accessors

### `requests`

Read-only array of all captured requests in order.

```ts
const all = chats.outgoing.requests;
// [{ method: 'sendMessage', payload: { chat_id: 1, text: 'Hi!' } }, ...]
```

### `length`

Number of captured requests.

```ts
expect(chats.outgoing.length).toBe(3);
```

### `getMethods()`

Array of method names in capture order.

```ts
expect(chats.outgoing.getMethods()).toEqual(['sendChatAction', 'sendMessage']);
```

### `getFirst<TApi>()` / `getLast<TApi>()`

First or last request, typed to a specific method.

```ts
const first = chats.outgoing.getFirst<'sendMessage'>();
expect(first?.payload.text).toBe('Hello!');
```

### `getTwoLast<TApi, TBot>()`

Last two requests as a typed tuple, oldest first.

```ts
const [action, msg] = chats.outgoing.getTwoLast<'sendChatAction', 'sendMessage'>();
expect(action?.payload.action).toBe('typing');
expect(msg?.payload.text).toBe('Done');
```

### `getThreeLast<T1, T2, T3>()`

Last three requests as a typed triple.

### `getAll<T1, T2, ...>()`

Entire capture store as a typed tuple (up to 10 type arguments). Useful for verifying the exact
sequence of API calls:

```ts
const [msg1, msg2, action] = chats.outgoing.getAll<'sendMessage', 'sendMessage', 'sendChatAction'>();

expect(msg1?.payload.text).toBe('Step 1');
expect(msg2?.payload.text).toBe('Step 2');
expect(action?.payload.action).toBe('typing');
```

### `clear()`

Removes all captured requests.

```ts
chats.outgoing.clear();
expect(chats.outgoing.length).toBe(0);
```

---

## Error simulation

### `failNext(method, errorOrSpec)` — one-shot failure

Forces the next call to `method` to reject. After firing once, subsequent calls use the normal
canned response.

```ts
chats.outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden: bot was blocked' });

await user.sendText('trigger'); // bot calls sendMessage → throws GrammyError
// Next call succeeds normally
await user.sendText('again');
```

### `failAll(method, errorOrSpec)` — sticky failure

Forces **every** call to `method` to reject until `clearOverrides()` is called.

```ts
chats.outgoing.failAll('getChatMember', { code: 400, description: 'Bad Request' });

// All getChatMember calls fail
await user.sendCommand('/check');
await user.sendCommand('/verify');

chats.outgoing.clearOverrides();
// Now getChatMember succeeds again
```

### `respondNext(method, payload)` — custom response

Overrides the response for the next call to `method`.

```ts
chats.outgoing.respondNext('getChatMember', {
  status: 'administrator',
  user: { id: user.id, is_bot: false, first_name: 'Alice' },
});

await user.sendCommand('/admin-only');
// bot calls getChatMember → gets administrator status → proceeds
```

### `clearOverrides()`

Drops all one-shot and sticky overrides.

```ts
chats.outgoing.clearOverrides();
```

---

## GrammyErrorSpec

When passing error specs to `failNext` / `failAll`, you can use a shorthand instead of building
a full `GrammyError`:

```ts
// Shorthand spec:
{ code: 403, description: 'Forbidden: bot was blocked by the user' }

// Or a real GrammyError:
import { GrammyError } from 'grammy'; // re-exported from grammy-testing
```

---

## Request type

```ts
interface Request<TMethod extends Methods = Methods> {
  method: TMethod;
  payload: Payload<TMethod>;
  signal?: AbortSignal;
}
```

`Payload<TMethod>` is the exact parameter object for that method (from grammY's RawApi types).
