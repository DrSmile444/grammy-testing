# PrivateChat (API Reference)

```ts
class PrivateChat<TContext extends Context = Context>
```

## Properties

| Property   | Type                    | Description                            |
| ---------- | ----------------------- | -------------------------------------- |
| `id`       | `number`                | Chat ID (same as the user's ID)        |
| `type`     | `'private'`             | Chat type discriminant                 |
| `user`     | `User<TContext>`        | The user this chat belongs to          |
| `messages` | `MessagesLog<TContext>` | Bot messages sent to this private chat |

## Notes

`PrivateChat` has no dispatch methods of its own — all updates are dispatched through the
`User` actor. The `messages` log tracks bot sends targeted at this private chat.

`PrivateChat` is auto-created when you call `chats.newUser()`. Access it via:

```ts
const user = chats.newUser();
const dm = user.privateChat;
// or
const dm = chats.newPrivateChat(user); // returns the same instance
```

## See also

- [PrivateChat guide](/high-level/private-chat)
