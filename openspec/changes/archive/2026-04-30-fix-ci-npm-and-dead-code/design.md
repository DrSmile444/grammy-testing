## Context

CI runs on Node 18, 20, and 22. The lockfile was generated locally with npm 11.9.0 (Node 22's current bundled version on this machine). Node 18 ships with npm 9.x and Node 20 with npm 10.x. `npm ci` is strict: if the lockfile was produced by a different npm major, it may reject it with "package.json and package-lock.json are out of sync."

Separately, two dead-code artifacts exist after the post-review refactor:

1. `Chats.pollStateCounter` — incremented on every `dispatchPollState` call but its value is never read (update_id now uses `ids.nextUpdateId()`).
2. `Channel.postMessageTo` — defaults `messageId` to `nextUpdateId()`, conflating the update-ID counter (starts at 1,000,000) with the message-ID space (should start near 1, per Telegram semantics).

## Goals / Non-Goals

**Goals:**

- All three CI matrix nodes (Node 18, 20, 22) install dependencies with the same npm version.
- `pollStateCounter` is removed from `Chats`.
- `Channel.postMessageTo` uses a dedicated message-ID counter rather than reusing the update-ID counter.

**Non-Goals:**

- Changing the CI matrix itself (Node versions stay as-is).
- Changing any public API surface or adding new high-level verbs.
- Addressing other potential ID-space collisions beyond `Channel.postMessageTo`.

## Decisions

### D1 — corepack over pinning npm in CI steps

**Decision**: Add `"packageManager": "npm@11.9.0"` to `package.json` and add `corepack enable` to each CI job, rather than running `npm install -g npm@11` per job.

**Rationale**: `packageManager` is a Node.js standard field (corepack reads it since Node 16.9). It documents the intended npm version as a project artifact visible to all contributors, not just CI. Any developer running `corepack enable` locally gets the same npm automatically. `npm install -g npm@X` per job is ephemeral and invisible.

**Alternative considered**: Replace `npm ci` with `npm install` in CI. Rejected because it removes the lockfile-sync safety net — if package.json and package-lock.json drift, CI will silently paper over it instead of catching it.

### D2 — Dedicated `nextMessageId()` counter on `IdGenerator`

**Decision**: Add `nextMessageId(): number` to `IdGenerator` starting at `1` (not at the update-ID range). `Channel.postMessageTo` uses `ids.nextMessageId()` for its default message ID.

**Rationale**: Telegram `message_id` is per-chat sequential starting near 1. Using `nextUpdateId()` (starting at 1,000,000) as a message ID default is semantically wrong and could cause confusing assertion failures if tests compare message ID ranges. A dedicated counter starting at 1 is faithful to Telegram semantics and consistent with how `IdGenerator` already separates user IDs, group IDs, and update IDs.

**Alternative considered**: Keep reusing `nextUpdateId()` since it "works." Rejected because the conflation is surprising and was explicitly flagged in the PR review.

## Risks / Trade-offs

- **[Risk] `nextMessageId()` changes existing message ID values in `Channel.postMessageTo`** → Tests that assert on specific message ID values (e.g., `expect(reply.messageId).toBe(1_000_005)`) will break. Mitigation: message ID defaults are implementation details; no reference-suite test asserts on specific default message ID values.
- **[Risk] corepack downloads npm 11.9.0 in CI on first run** → Adds a small network step. Mitigation: corepack caches downloads; subsequent runs are fast.
- **[Risk] Developers without corepack enabled get a prompt** → Corepack is opt-in locally. Mitigation: document `corepack enable` in the README or CONTRIBUTING guide as a one-time setup step. The `packageManager` field does not break npm if corepack is not active — it is advisory when corepack is disabled.
