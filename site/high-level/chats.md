# Chats

`Chats` is the central orchestrator returned by `prepareBot`, `prepareComposer`, and
`prepareMiddleware`. It manages all actors, routes captured API calls to the right logs,
and exposes the async settle helper.

```ts
const { chats } = await prepareBot(bot);
```

## Actor factories

### `newUser(profile?)`

Creates a `User` actor. A new `PrivateChat` is auto-created for DMs.

```ts
const user = chats.newUser(); // auto id + "User 100000001"
const alice = chats.newUser({ first_name: 'Alice' });
const bob = chats.newUser({ id: 42, first_name: 'Bob', username: 'bob42' });
```

**Type:** `(profile?: UserProfile) => User<TContext>`

### `newAdmin(profile?)`

Creates a user and promotes them to administrator in `chats.defaultGroup`. Shorthand for
`newUser` + `group.promote(user)`.

```ts
const admin = chats.newAdmin({ first_name: 'Moderator' });
```

### `newOwner(profile?)`

Creates a user and sets their status to `creator` in `chats.defaultGroup`.

```ts
const owner = chats.newOwner({ first_name: 'Boss' });
```

### `newGroup(profile?)`

Creates a `Group` actor.

```ts
const group = chats.newGroup();
const group = chats.newGroup('My Group');
const group = chats.newGroup({ id: -100, title: 'Specific Group' });
```

**Type:** `(profile?: string | ChatProfile) => Group<TContext>`

### `newSupergroup(profile?)`

Creates a `Supergroup` actor (same API as `Group`, different `type` discriminant).

```ts
const sg = chats.newSupergroup('Tech Chat');
```

### `newChannel(profile?)`

Creates a `Channel` actor.

```ts
const channel = chats.newChannel();
const channel = chats.newChannel({ title: 'Announcements' });
```

### `newPrivateChat(user)`

Creates a `PrivateChat` for a specific user. Usually auto-created by `newUser()`, but call this
when you need an explicit reference.

```ts
const dm = chats.newPrivateChat(alice);
```

### `newBusinessAccount()`

Creates a `BusinessAccount` actor for testing the Telegram Business API.

```ts
const account = chats.newBusinessAccount();
```

---

## Log accessors

### `repliesFor(user)`

Returns the `RepliesInbox` for the given user — all replies the bot sent to that user.
Same as `user.replies`.

```ts
const lastReply = chats.repliesFor(alice).lastOrThrow();
```

### `actionsFor(user)`

Returns the `ActionsLog` for the given user — all `sendChatAction` calls targeting that user.

```ts
const actions = chats.actionsFor(user);
expect(actions.last?.action).toBe('typing');
```

### `editsFor(user)`

Returns the `EditsLog` for the given user — all `editMessageText`, `editMessageCaption`, and
`editMessageMedia` calls targeting that user's private chat.

```ts
const edit = chats.editsFor(user).lastOrThrow();
expect(edit.text).toBe('Updated text');
```

### `deletionsFor(chat)`

Returns the `DeletionsLog` for the given chat (group, channel, or private chat).

```ts
const deletion = chats.deletionsFor(group).lastOrThrow();
expect(deletion.messageId).toBe(42);
```

---

## Other properties

### `outgoing`

The `OutgoingRequests` store — every raw API call captured by the transformer.

```ts
expect(chats.outgoing.getMethods()).toContain('sendMessage');
```

### `idle()`

Returns a promise that resolves when all in-flight transformer promises have settled. Use after
fire-and-forget API calls in your handlers.

```ts
await user.sendText('trigger');
await chats.idle();
expect(chats.outgoing.length).toBe(2); // reply + log call
```

### `clear()`

Resets all logs (replies, messages, edits, deletions, actions) and clears `outgoing`. Does **not**
remove actors or membership state.

```ts
await user.sendCommand('/setup');
chats.clear(); // start fresh before the real assertion

await user.sendCommand('/action');
expect(user.replies.lastOrThrow().text).toBe('Done');
```

### `defaultGroup`

The default `Supergroup` used by `newAdmin` and `newOwner`. Auto-created on first access.

```ts
const admin = chats.newAdmin();
// admin is already a member of chats.defaultGroup as 'administrator'
```
