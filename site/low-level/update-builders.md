# Update Builders

Update builders let you construct raw `Update` objects manually. Import them from the
`@grammyjs/testing/low-level` subpath.

```ts
import {
  GenericMockUpdate,
  MessagePrivateMockUpdate,
  MessageMockUpdate,
  NewMemberMockUpdate,
  LeftMemberMockUpdate,
  MyChatMemberMockUpdate,
} from '@grammyjs/testing/low-level';
```

## When to use update builders

The high-level actor methods (`user.sendText`, `user.sendCommand`, etc.) cover most scenarios.
Reach for update builders when you need:

- A specific update shape not exposed by any actor method
- Full control over every field of the `Update` object
- Low-level integration testing of transformer or middleware logic directly

## GenericMockUpdate

Abstract base class for all update builders. Provides fixture factories (genericUser, genericChat,
genericMember) and declares the `build()` contract.

```ts
class GenericMockUpdate {
  protected genericUser: TelegramUser;
  protected genericChat: Chat;
  protected genericMember: ChatMember;

  abstract build(): PartialUpdate<Update>;
}

type PartialUpdate<U extends Update> = Omit<U, 'update_id'>;
```

## MessagePrivateMockUpdate

Builds a private-chat text-message update.

```ts
import { MessagePrivateMockUpdate } from '@grammyjs/testing/low-level';

const update = new MessagePrivateMockUpdate('Hello!');
const bot = new Bot('token');
await bot.handleUpdate({ update_id: 1, ...update.build() });
```

## MessageMockUpdate

Builds a supergroup text-message update.

```ts
const update = new MessageMockUpdate('Group message text');
await bot.handleUpdate({ update_id: 1, ...update.build() });
```

## NewMemberMockUpdate

Builds a `new_chat_members` service message for a supergroup.

```ts
const update = new NewMemberMockUpdate();
await bot.handleUpdate({ update_id: 1, ...update.build() });
```

## LeftMemberMockUpdate

Builds a `left_chat_member` service message.

```ts
const update = new LeftMemberMockUpdate();
await bot.handleUpdate({ update_id: 1, ...update.build() });
```

## MyChatMemberMockUpdate

Builds a `my_chat_member` update (the bot's own membership status changing).

```ts
import { MyChatMemberMockUpdate } from '@grammyjs/testing/low-level';

const update = new MyChatMemberMockUpdate();
await bot.handleUpdate({ update_id: 1, ...update.build() });
```

## Prefer high-level actors

Update builders give you control but require more boilerplate. For membership events, use the
high-level alternatives instead:

```ts
// High-level (preferred):
await user.joinChat(group); // → new_chat_members
await user.leaveChat(group); // → left_chat_member
group.changeMemberStatus(user, { old_status: 'left', new_status: 'member' }); // → my_chat_member

// Low-level (when you need exact field control):
const update = new NewMemberMockUpdate();
await bot.handleUpdate({ update_id: 1, ...update.build() });
```
