# Reference test suite

This directory is the **v1.0 acceptance suite** for `@grammyjs/testing`. Per the [project-vision spec](../../openspec/specs/project-vision/spec.md) and [`docs/project.md` §"Reference test suite"](../../docs/project.md), v1.0 cuts only when every test in here passes — these are the patterns the plugin must support to credibly claim parity with `ua-anti-spam-bot`'s real-world test surface.

## Organization

Files are organized by **pattern category**, not by capability. A test author asks "how do I test commands?" — that's how you find the file.

| File                                                     | What it covers                                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`commands.spec.ts`](./commands.spec.ts)                 | `/start`, `/help`, `/lang en` style commands with `bot_command` entities; arg parsing; admin-only commands.      |
| [`messages.spec.ts`](./messages.spec.ts)                 | Text messages with custom entities, `parse_mode`, single-level replies, forwarded messages, edited messages.     |
| [`channel-posts.spec.ts`](./channel-posts.spec.ts)       | Channel-as-author posts into a supergroup (Coverage-audit gap #3).                                               |
| [`media-groups.spec.ts`](./media-groups.spec.ts)         | N-update dispatch with shared `media_group_id`; caption-on-first-only; bot-side aggregation by `media_group_id`. |
| [`membership.spec.ts`](./membership.spec.ts)             | `promote` / `restrict` / `changeMemberStatus`; admin-only command guards; restriction-with-`untilDate`.          |
| [`service-messages.spec.ts`](./service-messages.spec.ts) | `new_chat_members` / `left_chat_member` via `user.joinChat` / `user.leaveChat`.                                  |
| [`sessions.spec.ts`](./sessions.spec.ts)                 | `mockSession` / `mockChatSession` / `mockState`; cross-call mutation; combined session usage.                    |
| [`error-simulation.spec.ts`](./error-simulation.spec.ts) | `failNext` / `failAll` / `respondNext`; rate-limit handling; blocked-user handling.                              |
| [`menu-flows.spec.ts`](./menu-flows.spec.ts)             | `clickButton` end-to-end flows; chained keyboards; URL-button rejection.                                         |

Each file ships with a JSDoc header describing the corresponding `ua-anti-spam-bot` source range, what the pattern exercises, the v0.2 API verbs used, and any v0.2.x gap notes.

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

- **No domain-specific terminology.** Tests describe testing patterns ("deletes a forwarded message"), not anti-spam business logic ("flags a swindler"). Anti-spam-specific tests stay in the `ua-anti-spam-bot` repository.
- **Highest-API-surface first.** A reference test reaches for `buildOverwrite()` or low-level builders only when no v0.2 verb covers the pattern — and tags the usage with a `// v0.2.x gap: <description>` comment.
- **Generic example bots.** `/start` welcome bots, echo bots, simple menu bots, language pickers. Each example focuses on one testing pattern.
- **Header block per file.** `grep -rn "v0.2.x gap" tests/reference/` enumerates every escape-hatch usage; each one has a row above.
