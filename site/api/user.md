# User (API Reference)

Complete reference for the `User<TContext>` class. See [User guide](/high-level/user) for
narrative documentation with grouped examples.

## Type parameter

```ts
class User<TContext extends Context = Context>
```

## UserProfile

```ts
interface UserProfile {
  id?: number; // auto-generated if omitted
  first_name?: string; // default: "User {id}"
  last_name?: string;
  username?: string;
  is_bot?: boolean;
  language_code?: string;
}
```

## BotUserProfile

```ts
interface BotUserProfile extends UserProfile {
  is_bot: true;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}
```

## Properties

| Property      | Type                     | Description              |
| ------------- | ------------------------ | ------------------------ |
| `id`          | `number`                 | Telegram user ID         |
| `replies`     | `RepliesInbox<TContext>` | Bot replies to this user |
| `privateChat` | `PrivateChat<TContext>`  | This user's private chat |

## Membership

### `in(chat): Membership<TContext> | undefined`

Returns the user's membership in the given chat, or `undefined` if not a member.

```ts
const membership = user.in(group);
expect(membership?.status).toBe('administrator');
```

## Dispatch methods (summary)

All methods return `Promise<Message>` unless noted.

### Text & commands

| Method        | Signature                                                                         |
| ------------- | --------------------------------------------------------------------------------- |
| `sendText`    | `(text: string, options?: SendTextOptions) => Promise<Message>`                   |
| `sendMessage` | Alias for `sendText`                                                              |
| `sendCommand` | `(command: string, args?: string, options?: SendTextOptions) => Promise<Message>` |

### Media

| Method           | Signature                                                             |
| ---------------- | --------------------------------------------------------------------- |
| `sendPhoto`      | `(fileId?: string, options?: SendPhotoOptions) => Promise<Message>`   |
| `sendDocument`   | `(options?: SendDocumentOptions) => Promise<Message>`                 |
| `sendVideo`      | `(options?: SendVideoOptions) => Promise<Message>`                    |
| `sendAudio`      | `(options?: SendAudioOptions) => Promise<Message>`                    |
| `sendVoice`      | `(options?: SendVoiceOptions) => Promise<Message>`                    |
| `sendVideoNote`  | `(options?: SendVideoNoteOptions) => Promise<Message>`                |
| `sendAnimation`  | `(options?: SendAnimationOptions) => Promise<Message>`                |
| `sendSticker`    | `(fileId?: string, options?: SendStickerOptions) => Promise<Message>` |
| `sendMediaGroup` | `(items: UserSendMediaGroupItem[]) => Promise<Message[]>`             |

### Special content

| Method           | Signature                                                           |
| ---------------- | ------------------------------------------------------------------- |
| `sendLocation`   | `(options?: SendLocationOptions) => Promise<Message>`               |
| `sendContact`    | `(options?: SendContactOptions) => Promise<Message>`                |
| `sendVenue`      | `(options?: SendVenueOptions) => Promise<Message>`                  |
| `sendPoll`       | `(question: string, options?: SendPollOptions) => Promise<Message>` |
| `sendDice`       | `(options?: SendDiceOptions) => Promise<Message>`                   |
| `sendWebAppData` | `(data: string, buttonText: string, options?) => Promise<Message>`  |

### Group/service events

| Method      | Signature                                                   |
| ----------- | ----------------------------------------------------------- |
| `joinChat`  | `(chat: Group \| Supergroup, options?) => Promise<Message>` |
| `leaveChat` | `(chat: Group \| Supergroup, options?) => Promise<Message>` |

### Inline & callback

| Method               | Signature                                                             |
| -------------------- | --------------------------------------------------------------------- |
| `sendInlineQuery`    | `(query: string, options?: SendInlineQueryOptions) => Promise<void>`  |
| `chooseInlineResult` | `(resultId: string, options?) => Promise<void>`                       |
| `sendCallbackQuery`  | `(data: string, options?: SendCallbackQueryOptions) => Promise<void>` |

### Reactions & polls

| Method       | Signature                                                                               |
| ------------ | --------------------------------------------------------------------------------------- |
| `reactTo`    | `(reply: Reply, reaction: ReactionType, options?: ReactToOptions) => Promise<void>`     |
| `answerPoll` | `(reply: Reply, optionIndices: number[], options?: AnswerPollOptions) => Promise<void>` |

### Payment

| Method                  | Signature                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| `sendSuccessfulPayment` | `(options?: SendSuccessfulPaymentOptions) => Promise<Message>`           |
| `sendShippingQuery`     | `(options?) => Promise<void>`                                            |
| `sendPreCheckoutQuery`  | `(options?) => Promise<void>`                                            |
| `purchasePaidMedia`     | `(payload: string, options?: PurchasePaidMediaOptions) => Promise<void>` |

### Bot & chat management

| Method        | Signature                                                                         |
| ------------- | --------------------------------------------------------------------------------- |
| `boostChat`   | `(chat: AnyChat, options?: BoostChatOptions) => Promise<void>`                    |
| `removeBoost` | `(chat: AnyChat, boostId: string, options?: RemoveBoostOptions) => Promise<void>` |
| `requestJoin` | `(group: Group \| Supergroup, options?: RequestJoinOptions) => Promise<void>`     |
| `manageBot`   | `(botUser: User, options?: ManageBotOptions) => Promise<void>`                    |

## SendTextOptions

```ts
interface SendTextOptions<TContext extends Context = Context> {
  chat?: Group<TContext> | Supergroup<TContext> | Channel<TContext> | PrivateChat<TContext>;
  reply_to_message?: Partial<Message> & { message_id: number };
  anonymous?: boolean;
  // ... all sendMessage parameters (parse_mode, entities, reply_markup, etc.)
}
```

## GROUP_ANONYMOUS_BOT

Constant representing the Telegram anonymous group admin identity:

```ts
const GROUP_ANONYMOUS_BOT: TelegramUser = {
  id: 1_087_968_824,
  is_bot: true,
  first_name: 'Group',
  username: 'GroupAnonymousBot',
};
```
