## Why

CI fails on Node 18 because the lockfile was generated with npm 11 (local) while Node 18 in CI ships with npm 9 — `npm ci` rejects the mismatch. Separately, two dead-code artifacts leaked into the codebase during the post-review refactor: an unused instance counter and a conflated ID space in `Channel`.

## What Changes

- Add `"packageManager": "npm@11.9.0"` to `package.json`, pinning the npm version as a first-class project artifact via corepack.
- Add `corepack enable` step to all three CI jobs (`test`, `build-and-verify`, `bun`) before `npm ci` / `bun install`.
- Regenerate `package-lock.json` with npm 11 so the lockfile is consistent across all CI matrix nodes.
- Remove the unused `pollStateCounter` field and its dead increment from `Chats` (`chats.ts`).
- Extract `nextMessageId()` from `IdGenerator` and use it in `Channel.postMessageTo` instead of reusing `nextUpdateId()` for the message ID default.

## Capabilities

### New Capabilities

- `ci-npm-version`: CI workflow pins the npm package manager version via corepack so all matrix nodes use the same npm.

### Modified Capabilities

- `bot-test-harness`: `IdGenerator.nextMessageId()` is added as a new method; the update-ID and message-ID counters are now distinct. No requirement behavior changes — this is an internal correctness fix.

## Impact

- `package.json`: adds `packageManager` field.
- `package-lock.json`: regenerated with npm 11.
- `.github/workflows/ci.yml`: adds `corepack enable` step to all jobs.
- `src/high-level/id-generator.ts`: new `nextMessageId()` method.
- `src/high-level/channel.ts`: `postMessageTo` uses `ids.nextMessageId()` for the default message ID.
- `src/high-level/chats.ts`: removes `private pollStateCounter` declaration and increment.
