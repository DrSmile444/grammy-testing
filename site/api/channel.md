# Channel (API Reference)

```ts
class Channel<TContext extends Context = Context>
```

## Properties

| Property   | Type                                | Description                  |
| ---------- | ----------------------------------- | ---------------------------- |
| `id`       | `number`                            | Negative channel ID          |
| `type`     | `'channel'`                         | Chat type discriminant       |
| `title`    | `string`                            | Channel title                |
| `messages` | `MessagesLog<TContext>`             | Bot messages in this channel |
| `members`  | `Map<number, Membership<TContext>>` | Membership state             |

## Methods

| Method                  | Signature                                                                            | Description                           |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------- |
| `postMessageTo`         | `(chat: Group \| Supergroup \| Channel, text: string, options?) => Promise<Message>` | Post as channel into a linked group   |
| `editPost`              | `(messageId: number, newText: string, options?: EditPostOptions) => Promise<void>`   | Dispatch `edited_channel_post`        |
| `changeMemberStatus`    | `(user: User<TContext>, transition: MemberStatusTransition) => void`                 | Dispatch `my_chat_member` for channel |
| `dispatchReactionCount` | `(messageId, reactions, options?) => Promise<void>`                                  | Dispatch `message_reaction_count`     |
| `sendSystemMessage`     | `(text: string, options?: SendSystemMessageOptions) => Promise<Message>`             | System message                        |

## EditPostOptions

```ts
interface EditPostOptions {
  parse_mode?: ParseMode;
  entities?: MessageEntity[];
  reply_markup?: InlineKeyboardMarkup;
}
```

## See also

- [Channel guide](/high-level/channels)
