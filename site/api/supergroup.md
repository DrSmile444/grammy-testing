# Supergroup (API Reference)

```ts
class Supergroup<TContext extends Context = Context>
```

`Supergroup` has the same API as [`Group`](/api/group) — every method and property is identical.
The only difference is the `type` discriminant.

## Properties

| Property   | Type                                |
| ---------- | ----------------------------------- |
| `id`       | `number`                            |
| `type`     | `'supergroup'`                      |
| `title`    | `string`                            |
| `messages` | `MessagesLog<TContext>`             |
| `members`  | `Map<number, Membership<TContext>>` |

## Methods

All methods are identical to `Group`. See [`Group`](/api/group) for complete signatures.

| Method                                               | Description                       |
| ---------------------------------------------------- | --------------------------------- |
| `join(user)`                                         | Add as member                     |
| `own(user)`                                          | Set as creator                    |
| `promote(user, perms?)`                              | Make admin                        |
| `restrict(user, perms?)`                             | Restrict user                     |
| `changeMemberStatus(user, transition)`               | Dispatch `my_chat_member`         |
| `dispatchMemberUpdate(admin, target, status, opts?)` | Dispatch `chat_member`            |
| `dispatchReactionCount(msgId, reactions, opts?)`     | Dispatch `message_reaction_count` |
| `sendSystemMessage(text, opts?)`                     | Service message                   |
| `postRelayMessage(text, opts?)`                      | Channel-forwarded message         |

## When to use Group vs Supergroup

- Use `newSupergroup()` for modern groups (most Telegram groups are supergroups).
- Use `newGroup()` when testing code that specifically checks `chat.type === 'group'`.
- `chats.defaultGroup` is a `Supergroup`.

## See also

- [Group & Supergroup guide](/high-level/groups)
- [`Group`](/api/group)
