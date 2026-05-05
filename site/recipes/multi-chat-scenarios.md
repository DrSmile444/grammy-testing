# Multi-Chat Scenarios

## Multiple users in a group

```ts
const { chats } = await prepareBot(createBot());
const group = chats.newSupergroup('Community');
const alice = chats.newUser({ first_name: 'Alice', id: 1 });
const bob = chats.newUser({ first_name: 'Bob', id: 2 });
const admin = chats.newAdmin({ id: 99 });

group.own(alice);
group.own(bob);

await alice.sendText('Hi!', { chat: group });
await alice.sendText('How are you?', { chat: group });
await bob.sendText('Hello!', { chat: group });

expect(group.messages.length).toBe(3);

// Trigger an admin action
await admin.sendCommand('/summary', undefined, { chat: group });

expect(group.messages.last?.text).toBe('Summary posted to channel.');
```

## Cross-chat routing

A bot that reads from a group and posts summaries to a channel:

```ts
const { chats } = await prepareBot(createMultiChatBot(CHANNEL_ID));

const channel = chats.newChannel({ id: CHANNEL_ID, title: 'Digest' });
const group = chats.newSupergroup('Forum');
const user = chats.newUser({ id: 55 });
const admin = chats.newAdmin();

group.own(user);

await user.sendText('test message', { chat: group });
await admin.sendCommand('/summary', undefined, { chat: group });

// Check the channel received a message
const channelPost = chats.outgoing.requests.find(
  (r) => r.method === 'sendMessage' && (r.payload as { chat_id: number }).chat_id === channel.id,
);

expect(channelPost).toBeDefined();
expect((channelPost?.payload as { text: string }).text).toContain('User 55');
```

## Checking per-user replies in a group

When your bot @-mentions users or sends targeted replies in a group:

```ts
const group = chats.newSupergroup();
group.join(alice);
group.join(bob);

await alice.sendCommand('/help', undefined, { chat: group });

// Alice gets the reply
expect(alice.replies.lastOrThrow().text).toContain('commands');

// Bob gets nothing
expect(bob.replies.length).toBe(0);
```

## Multiple chats simultaneously

```ts
const privateChat1 = chats.newPrivateChat(alice);
const privateChat2 = chats.newPrivateChat(bob);
const group = chats.newSupergroup();

group.join(alice);
group.join(bob);

// Alice sends in private, bob sends in group
await alice.sendText('private msg');
await bob.sendText('group msg', { chat: group });

expect(alice.replies.last?.text).toBeDefined();
expect(group.messages.last?.text).toBeDefined();
expect(privateChat2.messages.length).toBe(0); // bot didn't reply to bob in private
```

## Resetting between sub-tests

Use `chats.clear()` to reset all logs without recreating actors:

```ts
await user.sendCommand('/setup');
chats.clear(); // wipe logs from setup phase

await user.sendCommand('/action');
expect(user.replies.lastOrThrow().text).toBe('Action done');
expect(group.messages.length).toBe(1); // only the action's message
```
