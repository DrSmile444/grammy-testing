## Why

Three known limitations from TODO.md (#13, #14, #15) create friction for consumers: a `postinstall` hook that breaks `npm install`, no single-call reset for captured state between tests, and silent failures when the bot sends to unregistered chats. All three are self-contained fixes that unblock real usage.

## What Changes

- **Remove** `postinstall` entry from `package.json` — the `./scripts/link-codex-skills.sh` hook is a local dev convenience that does not exist in published packages and breaks consumer installs.
- **Add** `chats.clear()` method to the `Chats` class — atomically resets all captured logs (outgoing requests, replies, actions, edits, deletions, messages) and routing state (messageIdToReply, clickers) while preserving user/chat registries and memberships.
- **Add** `warnOnUnregisteredChats` option (default `true`) to `PrepareOptions` — emits a `console.warn` when an API call targets a chat ID not registered with the `Chats` orchestrator, with a clear message on how to register or suppress.

## Capabilities

### New Capabilities

- `chats-clear`: Single-call reset of all captured state on the `Chats` orchestrator between tests.
- `unregistered-chat-warning`: Developer warning when bot API calls target unknown chat IDs.

### Modified Capabilities

- `build-and-publish`: The `postinstall` script removal is a publishing/packaging behavior change.

## Impact

- `package.json`: remove `postinstall` line.
- `src/high-level/chats.ts`: add `clear()` method; add `warnOnUnregisteredChats` flag threaded through from `PrepareOptions`.
- `src/low-level/prepare-bot.ts`, `src/low-level/prepare-composer.ts`, `src/low-level/prepare-middleware.ts`: surface `warnOnUnregisteredChats` in their options types and wire it into the `Chats` constructor or a setter.
- No breaking changes. All existing API surface is preserved.
