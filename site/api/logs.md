# Logs (API Reference)

## MessagesLog\<TContext\>

Per-chat log of all bot sends.

```ts
class MessagesLog<TContext extends Context = Context>
```

| Property/Method   | Type                           | Description                         |
| ----------------- | ------------------------------ | ----------------------------------- |
| `all`             | `Reply<TContext>[]`            | All captured messages               |
| `last`            | `Reply<TContext> \| undefined` | Last captured message               |
| `length`          | `number`                       | Count                               |
| `byText(matcher)` | `Reply<TContext> \| undefined` | Find first by exact string or regex |
| `clear()`         | `void`                         | Reset                               |

---

## RepliesInbox\<TContext\>

Per-user log of bot replies to that user.

```ts
class RepliesInbox<TContext extends Context = Context>
```

| Property/Method | Type                           | Description                  |
| --------------- | ------------------------------ | ---------------------------- |
| `all`           | `Reply<TContext>[]`            | All replies                  |
| `last`          | `Reply<TContext> \| undefined` | Last reply                   |
| `length`        | `number`                       | Count                        |
| `lastOrThrow()` | `Reply<TContext>`              | Last reply or throws `Error` |
| `clear()`       | `void`                         | Reset                        |

---

## ActionsLog

Per-user log of `sendChatAction` calls.

```ts
class ActionsLog
```

| Property/Method | Type                              | Description          |
| --------------- | --------------------------------- | -------------------- |
| `all`           | `{ action: string }[]`            | All captured actions |
| `last`          | `{ action: string } \| undefined` | Last action          |
| `length`        | `number`                          | Count                |
| `clear()`       | `void`                            | Reset                |

---

## EditsLog

Per-user log of `editMessageText`, `editMessageCaption`, and `editMessageMedia` calls.

```ts
class EditsLog
```

### Edit interface

```ts
interface Edit {
  text?: string;
  caption?: string;
  messageId: number;
}
```

| Property/Method | Type                | Description         |
| --------------- | ------------------- | ------------------- |
| `all`           | `Edit[]`            | All edits           |
| `last`          | `Edit \| undefined` | Last edit           |
| `length`        | `number`            | Count               |
| `lastOrThrow()` | `Edit`              | Last edit or throws |
| `clear()`       | `void`              | Reset               |

---

## DeletionsLog\<TContext\>

Per-chat log of `deleteMessage` calls.

```ts
class DeletionsLog<TContext extends Context = Context>
```

### Deletion interface

```ts
interface Deletion<TContext extends Context = Context> {
  chatId: number;
  messageId: number;
  reply?: Reply<TContext>; // captured Reply if sent during the test
}
```

| Property/Method | Type                              | Description             |
| --------------- | --------------------------------- | ----------------------- |
| `all`           | `Deletion<TContext>[]`            | All deletions           |
| `last`          | `Deletion<TContext> \| undefined` | Last deletion           |
| `length`        | `number`                          | Count                   |
| `lastOrThrow()` | `Deletion<TContext>`              | Last deletion or throws |
| `clear()`       | `void`                            | Reset                   |

## See also

- [Logs guide](/high-level/logs)
