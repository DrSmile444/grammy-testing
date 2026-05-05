# BusinessAccount (API Reference)

```ts
class BusinessAccount<TContext extends Context = Context>
```

## Methods

| Method           | Signature                                                                                  | Dispatches                                |
| ---------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `connect`        | `(options?: ConnectOptions) => Promise<void>`                                              | `business_connection` (is_enabled: true)  |
| `disconnect`     | `(options?: ConnectOptions) => Promise<void>`                                              | `business_connection` (is_enabled: false) |
| `sendMessage`    | `(text: string, options?: BusinessSendMessageOptions) => Promise<void>`                    | `business_message`                        |
| `editMessage`    | `(messageId: number, text: string, options?: BusinessEditMessageOptions) => Promise<void>` | `edited_business_message`                 |
| `deleteMessages` | `(messageIds: number[], options?: BusinessDeleteMessagesOptions) => Promise<void>`         | `deleted_business_messages`               |

## ConnectOptions

```ts
interface ConnectOptions {
  business_connection_id?: string;
  user_chat_id?: number;
  date?: number;
  can_reply?: boolean;
  is_enabled?: boolean;
}
```

## BusinessSendMessageOptions

```ts
interface BusinessSendMessageOptions {
  business_connection_id?: string;
  parse_mode?: ParseMode;
  entities?: MessageEntity[];
  // ... other message options
}
```

## BusinessEditMessageOptions

```ts
interface BusinessEditMessageOptions {
  business_connection_id?: string;
  parse_mode?: ParseMode;
}
```

## BusinessDeleteMessagesOptions

```ts
interface BusinessDeleteMessagesOptions {
  business_connection_id?: string;
}
```

## See also

- [BusinessAccount guide](/high-level/business-account)
