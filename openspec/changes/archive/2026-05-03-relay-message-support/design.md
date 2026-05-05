## Context

`Channel_Bot` (`136_817_688`) and `GroupAnonymousBot` (`1_087_968_824`) each have dedicated
library abstractions that hide the magic identity from test code: `channel.postMessageTo()` and
`user.sendText({ anonymous: true })` respectively, with `makeChannelBotUser()` in `dispatch.ts`
as the internal factory.

The `777_000` relay identity has no such abstraction. It appears only via workarounds: test
authors construct the full `reply_to_message` inline, hard-code the ID, and cast with `as any`
because `Message` is a complex grammy-types union that requires all structural members.

There is also a second problem: the relay message itself is never dispatched in current tests.
The bot cannot handle or observe the relayed post — only the user's reply to it is dispatched,
with `reply_to_message` embedded inline. This means bots that react to the relay message itself
(e.g. delete it, read its text) cannot be tested.

## Goals / Non-Goals

**Goals:**

- `group.postRelayMessage` / `supergroup.postRelayMessage` dispatch the relay update, making
  it observable by the bot.
- The returned `Message` can be used directly in a follow-up `reply_to_message`, eliminating
  the inline construction problem entirely for the primary use case.
- `SendTextOptions.reply_to_message` accepts a partial shape for the "only have the ID" case.
- `TELEGRAM_RELAY` exported constant for assertions.

**Non-Goals:**

- Channel-self-dispatch of relay messages (relay comes from Telegram, not the channel).
- `forward_origin` auto-derivation — callers supply `options.channel` when they need it.
- Loosening types on other update shapes beyond `reply_to_message`.

## Decisions

### `postRelayMessage` on `Group` and `Supergroup`, not on `Channel`

**Decision:** The relay verb lives on the group/supergroup, not on the channel.

**Rationale:** The relay message _arrives_ in the group/supergroup. The channel does not
dispatch it — Telegram's infrastructure does. Placing the method on the receiving chat matches
the domain model and parallels `group.sendSystemMessage`. `channel.postMessageTo()` is already
the right verb for `sender_chat` channel posts, which is a different mechanism.

### Return `Promise<Message>` from `postRelayMessage`

**Decision:** Return the dispatched `Message` object.

**Rationale:** Consistent with `actor-sends-return-message`. The returned `Message` is
immediately usable as `reply_to_message` in a follow-up `user.sendText` — this is the primary
ergonomic win. Returning `void` would require callers to manually construct the partial shape,
defeating the purpose.

### Loosen `reply_to_message` to `Partial<Message> & { message_id: number }`

**Decision:** Change the type and auto-fill `date` and `chat` when absent.

**Rationale:** grammy-types `Message` is a large discriminated union. Constructing a
structurally valid `Message` for a "reply to some message" scenario requires populating
`date` and `chat`, which callers must always supply manually and always use the same values
(now, target chat). Making these auto-filled removes the boilerplate and eliminates `as any`.

`message_id` stays required because it's the only field with test-specific semantic content.

**Auto-fill rules:**

- `date`: `Math.floor(Date.now() / 1000)` when absent.
- `chat`: resolved target chat (same as the message being sent) when absent.

**Alternative considered:** A dedicated `replyToRelay` shorthand option — rejected because it
only solves the relay case and requires test authors to learn a new option. With the loose type,
the relay case is solved by passing the `Message` returned from `postRelayMessage`, and the
"only have an ID" case is solved by passing `{ message_id: 100 }`.

### Internal `makeRelayUser()` factory in `dispatch.ts`

**Decision:** Add `makeRelayUser()` alongside the existing `makeChannelBotUser()`.

**Rationale:** Consistent pattern. Keeps magic IDs out of `group.ts` and `supergroup.ts`.
Exportable as `TELEGRAM_RELAY` for assertion use.

## Risks / Trade-offs

- **Type change on `reply_to_message`** — `Partial<Message>` is structurally very loose.
  Tests that previously passed a full `Message` object continue to compile; tests that
  previously used `as any` can remove the cast. No regression risk.
- **Auto-fill silently hides intent** — a caller who omits `chat` from `reply_to_message`
  gets the target chat auto-filled. If they intended a different chat (rare, but possible),
  the test would be wrong silently. Mitigation: document the auto-fill behavior clearly.

## Migration Plan

No migration required. Both changes are backward-compatible. Update changelog and bump minor
version after implementation.
