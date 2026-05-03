## Context

grammy-testing models Telegram bot interactions as actor verbs (`user.sendText`, `channel.postMessageTo`, etc.) rather than raw `handleUpdate` calls. Three gaps remain where tests must still hand-craft updates:

1. Chats whose IDs are fixed at configuration time (log channels, training chats) cannot be registered via the factory — `newSupergroup()` always auto-generates an ID.
2. Anonymous admin posts (Telegram's "Send as Group" feature) produce a distinct wire shape (`from = GroupAnonymousBot`, `sender_chat = group`) with no actor verb.
3. Messages with no `from` field at all (certain Telegram service/system messages) require an `as any` cast and raw `handleUpdate`.

All three are strictly additive — no existing API changes.

## Goals / Non-Goals

**Goals:**

- Add object-profile overload to `newGroup`, `newSupergroup`, `newChannel` so caller-supplied IDs work
- Add `anonymous?: boolean` to `SendTextOptions` (and thread through `sendCommand`) for GroupAnonymousBot dispatch
- Add `sendSystemMessage(text, options?)` to Group, Supergroup, and Channel for from-absent messages
- Export new public surface: `ChatProfile`, `GROUP_ANONYMOUS_BOT`, `SendSystemMessageOptions`
- Mark all relevant TODO.md items resolved

**Non-Goals:**

- ID collision detection or validation (any integer accepted)
- Media content in system messages (text-only for the initial implementation)
- `sender_chat` on system messages (Telegram does not set it for the senderless pattern)
- Changing how `registerChat` works internally

## Decisions

### D1 — ChatProfile mirrors UserProfile; factory accepts `string | ChatProfile | undefined`

**Decision:** Add `interface ChatProfile { id?: number; title?: string; }` and update each factory to accept `string | ChatProfile | undefined`. A shared internal helper normalizes the three forms.

**Alternative considered:** Add a second optional parameter `newSupergroup(title?, options?: { id? })`. Rejected — splitting title and id across two parameters is less ergonomic and doesn't match the `newUser(profile)` precedent.

**Title default when id supplied:** `TypeName + Math.abs(id)` (e.g. `Supergroup1234567`). Avoids the confusing `Supergroup-1234567` that the existing `String(-id)` formula would produce for a positive caller-supplied id.

**Auto-ID counter:** Skipped entirely when `profile.id` is present. The counter is not advanced, so subsequent auto-generated chats are unaffected.

### D2 — `GROUP_ANONYMOUS_BOT` is a named exported constant

**Decision:** Define `export const GROUP_ANONYMOUS_BOT = { id: 136_817_688, is_bot: false, first_name: 'Group', username: 'GroupAnonymousBot' } as const` and export it from the package. Tests that need to assert on `message.from.id` can import the constant directly rather than hard-coding the magic number.

**Alternative considered:** Inline the object inside `sendText` without exporting. Rejected — the constant has value to consumers who want to write `expect(update.from.id).toBe(GROUP_ANONYMOUS_BOT.id)`.

### D3 — `anonymous: true` requires `options.chat` to be Group or Supergroup; throws otherwise

**Decision:** Validate at call time and throw a descriptive error if `options.chat` is absent or is a Channel or PrivateChat.

**Rationale:** GroupAnonymousBot only exists in group contexts on Telegram. Permitting it on a channel or private chat would produce an update shape that Telegram never actually sends.

### D4 — `sendSystemMessage` uses `as Message` / `as Update` cast

**Decision:** Construct the message object without `from` and cast via `as Message`. The same technique is used in existing unit tests (before-any.composer.spec.ts in ua-anti-spam-bot).

**Rationale:** Grammy's TypeScript types require `from` on `Message`. Since this is a deliberate fabrication of an unusual-but-real Telegram update, the cast is appropriate and isolated inside a single method.

### D5 — `sendSystemMessage` on Group, Supergroup, AND Channel

**Decision:** All three chat classes get the method. Channel system messages are rarer but real (channel created, pinned service messages in linked groups). Adding now prevents a future raw-`handleUpdate` regression.

## Risks / Trade-offs

- **Positive IDs for groups/channels**: Telegram uses negative IDs for group/supergroup/channel chats in production, but some bots hard-code non-standard IDs in tests or configs. Allowing any integer is deliberately permissive. [Risk: misleading if a test author accidentally passes a positive ID for a real group] → No mitigation; the author is responsible for matching their production config.
- **`as Message` cast in sendSystemMessage**: Bypasses TypeScript's type safety for the `from` field. [Risk: future Grammy type changes could silently accept this cast even if the shape becomes invalid] → Contained within a single method; easily auditable.
- **No `sender_chat` on anonymous posts for channels**: Channels don't support anonymous admin posting, so `anonymous: true` + `chat: channel` is already rejected. No gap introduced.
