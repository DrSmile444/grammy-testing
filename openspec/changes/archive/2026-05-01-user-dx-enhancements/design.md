## Context

The high-level API centres on three types: `Chats` (orchestrator), `User` (actor), and `RepliesInbox` (per-user reply collection). `Chats.deriveFromCapture` is the single choke-point through which every captured outgoing API call flows — it already builds `Reply` objects, pushes them into `chat.messages`, and routes them to per-user inboxes. The `messageIdToReply` registry (keyed by synthetic message ID) enables reverse lookup from an edit payload back to its original message.

Currently:

- `user.replies` does not exist; tests must call `chats.repliesFor(user)` at every assertion site.
- `RepliesInbox.last` is typed `Reply | undefined`, forcing callers into the assertion / optional-chain / disable-comment trilemma.
- `sendChatAction` calls flow through `deriveFromCapture` but are silently skipped — no per-user surface exists.
- `editMessage*` calls are similarly skipped.

## Goals / Non-Goals

**Goals:**

- Add `user.replies` as a delegating getter (zero indirection at call sites).
- Add `RepliesInbox.lastOrThrow()` returning `Reply<TContext>` (non-nullable).
- Add `chats.actionsFor(user)` returning `ActionsLog` for `sendChatAction` captures.
- Add `chats.editsFor(user)` returning `EditsLog` for `editMessage*` captures.
- Keep the `deriveFromCapture` choke-point as the single capture path.

**Non-Goals:**

- `chats.waitFor()` — excluded; `vi.waitFor` covers the documented use case.
- Tracking `sendChatAction` or edits across the raw `outgoing.requests` API — that already works.
- Routing edits for messages sent before the test started — not tracked by `messageIdToReply`.

## Decisions

### 1. Thread `RepliesInbox` through `UserDeps` as a direct reference

In `Chats.newUser()`, create the `RepliesInbox` _before_ constructing the `User`, pass it into the `UserDeps` bag, and store it as `this.deps.replies` on `User`. The same reference goes into the `UserEntry`.

**Alternative considered:** lazy delegation via a closure (`() => this.repliesFor(user)`) added to `UserDeps`. Rejected: introduces a circular reference to `Chats` and unnecessary indirection. A direct reference is simpler and the inbox's lifecycle is already tied to the user's.

### 2. `ActionsLog` stores `string` (the action name), not the full payload

`sendChatAction` carries one meaningful field: `action` (`'typing' | 'upload_photo' | ...`). Storing the action string directly makes assertions read naturally (`expect(actions.all).toContain('typing')`). The `raw` escape hatch can be added later if full-payload inspection is needed.

**Alternative considered:** store the full `Request` object. Rejected: over-engineering; the `action` string is the only field tests ever inspect, and raw access is already available via `outgoing.requests`.

### 3. `EditsLog` stores `Edit` objects — separate type, not `Reply`

`Edit` has `text`, `editedMessageId` (the `message_id` from the payload, linking back to the original `Reply`), and `raw`. It does NOT share the `Reply` type.

**Alternative considered:** reuse `Reply` with an `edited: true` flag, merging edits into `repliesFor`. Rejected: edits have different semantics — no buttons, no `mentionUsernames` routing, no `replyingTo`. Merging the types pollutes both and makes `repliesFor` ambiguous ("does this include edits?").

### 4. Routing for `actionsFor` and `editsFor` uses existing chat-membership logic

Both use the same `userReceivesReply` predicate: private-chat match by `chat_id`, or group membership check. For edits, the `chat_id` is resolved via `messageIdToReply` (look up the original `Reply`, take its `chat`). If the message ID is unknown, the edit is silently skipped — expected behaviour since pre-test messages are not tracked.

**Alternative considered:** separate routing rules for actions/edits. Rejected: consistency matters more than flexibility at this level. The routing logic is already tested and understood.

### 5. `actionsFor` and `editsFor` live in `Chats`, parallel to `repliesFor`

All three are factory methods on `Chats` returning per-user log views. This mirrors the existing pattern and keeps the orchestrator as the single source of truth for all capture surfaces.

## Risks / Trade-offs

- **Edits to pre-test messages are invisible** — `messageIdToReply` is only populated for messages sent during the test. Mitigation: document this limitation at the `editsFor` API level.
- **`ActionsLog` and `EditsLog` are new public types** — once exported, they are part of the public API and changes are semver-breaking. Mitigation: keep the types minimal; only expose what is needed.
- **`UserDeps` grows by one field** — any existing code that manually constructs `UserDeps` (e.g. tests of `User` in isolation) will need to be updated. Mitigation: the field can default to a no-op inbox for those cases, or existing usages can pass the real inbox.
