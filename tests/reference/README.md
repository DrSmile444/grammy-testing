# Reference test suite

This directory is the **v1.0 acceptance suite** for `@grammyjs/testing`. v1.0 cuts only when every test in here passes — these are the patterns the plugin must support.

## Organization

Files are organized by **pattern category**, not by capability. A test author asks "how do I test commands?" — that's how you find the file.

| File                                                                     | What it covers                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [`business-api.spec.ts`](./business-api.spec.ts)                         | `BusinessAccount` actor: `connect`, `disconnect`, `sendMessage`, `editMessage`, `deleteMessages`.                  |
| [`channel-posts.spec.ts`](./channel-posts.spec.ts)                       | Channel-as-author posts into a supergroup (sender_chat scenarios).                                                 |
| [`commands.spec.ts`](./commands.spec.ts)                                 | `/start`, `/help`, `/lang en` style commands with `bot_command` entities; arg parsing; admin-only commands.        |
| [`context-constructor.spec.ts`](./context-constructor.spec.ts)           | `prepareComposer` / `prepareMiddleware` with a class-based custom context (`ContextConstructor` option).           |
| [`error-simulation.spec.ts`](./error-simulation.spec.ts)                 | `failNext` / `failAll` / `respondNext`; rate-limit handling; blocked-user handling.                                |
| [`media-groups.spec.ts`](./media-groups.spec.ts)                         | N-update dispatch with shared `media_group_id`; caption-on-first-only; bot-side aggregation by `media_group_id`.   |
| [`media-single.spec.ts`](./media-single.spec.ts)                         | Single-media dispatch — photo, document, video; `file_id` propagation; caption handling.                           |
| [`membership.spec.ts`](./membership.spec.ts)                             | `promote` / `restrict` / `changeMemberStatus`; admin-only command guards; restriction-with-`untilDate`.            |
| [`menu-flows.spec.ts`](./menu-flows.spec.ts)                             | `clickButton` end-to-end flows; chained keyboards; URL-button rejection.                                           |
| [`messages.spec.ts`](./messages.spec.ts)                                 | Text messages with custom entities, `parse_mode`, single-level replies, forwarded messages, edited messages.       |
| [`modern-update-types.spec.ts`](./modern-update-types.spec.ts)           | Bot API 7+ updates: `message_reaction`, `poll_answer`, `chat_join_request`, `chat_boost`, `managed_bot`, and more. |
| [`private-chat-messages.spec.ts`](./private-chat-messages.spec.ts)       | `privateChat.messages` log; DMs appear in both `privateChat.messages` and `user.replies`.                          |
| [`remaining-dispatch-verbs.spec.ts`](./remaining-dispatch-verbs.spec.ts) | Audio, voice, video note, animation, sticker, location, contact, venue, poll, dice dispatch verbs.                 |
| [`reply-accessors.spec.ts`](./reply-accessors.spec.ts)                   | `reply.replyMarkup` and `reply.replyingTo` accessors.                                                              |
| [`service-messages.spec.ts`](./service-messages.spec.ts)                 | `new_chat_members` / `left_chat_member` via `user.joinChat` / `user.leaveChat`.                                    |
| [`sessions.spec.ts`](./sessions.spec.ts)                                 | `mockSession` / `mockChatSession` / `mockState`; cross-call mutation; combined session usage.                      |
| [`special-message-verbs.spec.ts`](./special-message-verbs.spec.ts)       | Web App data, successful payment, inline query, chosen inline result, pre-checkout query, shipping query.          |

Each file ships with a JSDoc header describing what the pattern exercises, the v0.2 API verbs used, and any v0.2.x gap notes.

## v0.2.x gap catalog

Patterns currently expressed via `buildOverwrite()` or low-level `MockUpdate` builders. Each row maps to a future high-level verb proposal that would close the gap.

| Pattern                                          | Current expression                                                | Suggested v0.2.x proposal |
| ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------- |
| Nested reply chains beyond single-level          | Inline `Update` with `message.reply_to_message` populated by hand | `add-nested-reply-chains` |
| Caption-bearing single message (non-media-group) | Currently impossible without media verbs                          | `add-media-verbs`         |

The proposal-name column is **suggestive**, not binding. When a v0.2.x verb proposal lands that closes a gap, that proposal must (1) update the corresponding reference test to use the new verb, (2) remove the `// v0.2.x gap` tag from the test, and (3) delete the row from this table.

## Plugin interop tests

Plugin ecosystem compatibility lives in **[`tests/plugins/`](../plugins/)**, separate from this suite. That directory contains one spec per supported plugin (`conversations`, `menu`, `parse-mode`, `chat-members`), each with a JSDoc header documenting the recipe and known constraints. See those files for patterns not covered here:

- `@grammyjs/conversations` — multi-step conversations require `client: { fetch: okFetch }` on the Bot constructor; verify control flow via side effects, not `chats.repliesFor`.
- `@grammyjs/menu` — `reply.clickButton(label)` works with menu plugin buttons despite opaque internal `callback_data`.
- `@grammyjs/chat-members` — dispatch `chat_member` updates directly via `bot.handleUpdate`; use `MemorySessionStorage` as the adapter.

## Conventions

- **No domain-specific terminology.** Tests describe testing patterns ("deletes a forwarded message"), not application-specific business logic.
- **Highest-API-surface first.** A reference test reaches for `buildOverwrite()` or low-level builders only when no v0.2 verb covers the pattern — and tags the usage with a `// v0.2.x gap: <description>` comment.
- **Generic example bots.** `/start` welcome bots, echo bots, simple menu bots, language pickers. Each example focuses on one testing pattern.
- **Header block per file.** `grep -rn "v0.2.x gap" tests/reference/` enumerates every escape-hatch usage; each one has a row above.
