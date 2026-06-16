# High-Level API Overview

The high-level layer is what most tests use. It models Telegram's domain directly: users,
groups, channels, private chats — each as an actor object you control.

## Two-layer design

```
┌───────────────────────────────────────────────────────────┐
│  High-Level Layer   grammy-testing                     │
│                                                           │
│  Chats (orchestrator)                                     │
│   ├─ newUser()   → User      → .replies (RepliesInbox)    │
│   │                          → .edits   (EditsLog)        │
│   │                          → .actions (ActionsLog)      │
│   ├─ newGroup()  → Group     → .messages (MessagesLog)    │
│   │               Supergroup → .deletions (DeletionsLog)  │
│   ├─ newChannel() → Channel  → .messages (MessagesLog)    │
│   └─ newPrivateChat() → PrivateChat → .messages           │
│                                                           │
│  Low-Level Layer   grammy-testing/low-level            │
│   ├─ OutgoingRequests  (raw capture)                      │
│   ├─ Mock update builders                                 │
│   └─ Session / state mocking                              │
└───────────────────────────────────────────────────────────┘
```

## When to use which layer

| Situation                          | Use                                    |
| ---------------------------------- | -------------------------------------- |
| Writing feature tests for handlers | High-level (`User`, `Group`, etc.)     |
| Asserting exact API call payload   | Low-level (`chats.outgoing`)           |
| Simulating API errors              | Low-level (`failNext`, `failAll`)      |
| Testing unusual update shapes      | Low-level update builders              |
| Mocking session/state              | Low-level (`mockSession`, `mockState`) |

## The Chats orchestrator

Everything starts with `chats`, returned by `prepareBot`:

```ts
const { chats } = await prepareBot(bot);
```

`chats` is the central hub. It:

- **Creates actors** — `newUser()`, `newGroup()`, `newSupergroup()`, `newChannel()`, etc.
- **Routes captured API calls** — when your bot calls `sendMessage`, chats routes the captured
  reply to the right user's `replies` inbox and the right chat's `messages` log.
- **Exposes cross-cutting accessors** — `repliesFor(user)`, `actionsFor(user)`, `editsFor(user)`,
  `deletionsFor(chat)`.
- **Provides `idle()`** — await all in-flight fire-and-forget API calls.

## Choosing the right page

| I want to…                     | Go to                                           |
| ------------------------------ | ----------------------------------------------- |
| Send messages as a user        | [User](/high-level/user)                        |
| Test membership in a group     | [Groups](/high-level/groups)                    |
| Post to a channel              | [Channel](/high-level/channels)                 |
| Test DM between bot and user   | [PrivateChat](/high-level/private-chat)         |
| Test Telegram Business API     | [BusinessAccount](/high-level/business-account) |
| Inspect bot replies            | [Reply](/high-level/reply)                      |
| Understand all log types       | [Logs](/high-level/logs)                        |
| Create actors and manage state | [Chats](/high-level/chats)                      |
