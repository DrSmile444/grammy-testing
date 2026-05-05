# Group (API Reference)

```ts
class Group<TContext extends Context = Context>
```

## Properties

| Property   | Type                                | Description               |
| ---------- | ----------------------------------- | ------------------------- |
| `id`       | `number`                            | Negative chat ID          |
| `type`     | `'group'`                           | Chat type discriminant    |
| `title`    | `string`                            | Chat title                |
| `messages` | `MessagesLog<TContext>`             | Bot messages in this chat |
| `members`  | `Map<number, Membership<TContext>>` | User ID → membership      |

## Methods

| Method                  | Signature                                                                | Description                       |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| `join`                  | `(user: User<TContext>) => void`                                         | Add user as `member`              |
| `own`                   | `(user: User<TContext>) => void`                                         | Set user as `creator`             |
| `promote`               | `(user: User<TContext>, perms?: PromotePermissions) => void`             | Make admin                        |
| `restrict`              | `(user: User<TContext>, perms?: RestrictPermissions) => void`            | Restrict user                     |
| `changeMemberStatus`    | `(user: User<TContext>, transition: MemberStatusTransition) => void`     | Dispatch `my_chat_member`         |
| `dispatchMemberUpdate`  | `(admin, target, newStatus, options?) => Promise<void>`                  | Dispatch `chat_member`            |
| `dispatchReactionCount` | `(messageId, reactions, options?) => Promise<void>`                      | Dispatch `message_reaction_count` |
| `sendSystemMessage`     | `(text: string, options?: SendSystemMessageOptions) => Promise<Message>` | Service message without sender    |
| `postRelayMessage`      | `(text: string, options?: PostRelayMessageOptions) => Promise<Message>`  | Channel-forwarded message         |

## PostRelayMessageOptions

```ts
interface PostRelayMessageOptions<TContext extends Context = Context> extends Omit<SendTextOptions<TContext>, 'chat' | 'anonymous'> {
  channel?: Channel<TContext>; // source channel for the forward_origin
}
```

## See also

- [Group & Supergroup guide](/high-level/groups)
- [`Supergroup`](/api/supergroup)
