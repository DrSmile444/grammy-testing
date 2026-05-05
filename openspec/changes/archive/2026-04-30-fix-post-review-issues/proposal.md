## Why

PR #1 introduced the `@grammyjs/testing` base and surfaced a set of correctness, isolation, and polish issues during code review. Addressing them now keeps the codebase clean before more features land on top of the affected files.

## What Changes

- **jsr.json version** synced from `0.1.0` to match `package.json` `0.7.1`
- **Node.js engines** field relaxed from `>=22.0.0` to `>=18.0.0`; CI matrix kept as-is (Node 18, 20, 22)
- **README** stray `---` separator removed
- **13 module-level counters** across 6 files converted to instance-scoped state, eliminating counter bleed between test runs
- **`dispatchServiceMessage` bug** fixed: `update_id` was `spec.updateId + serviceMessageCounter` (double-increment); corrected to `spec.updateId`
- **`IdGenerator`** gains `nextUpdateId()` method; `ids` threaded into `Group`, `Supergroup`, and `Channel` constructors so dispatch callers have a single authoritative ID source
- **`outgoing.requests`** changed from a public mutable field to a private `_requests` array with a `readonly` getter, preventing accidental external mutation
- **Rule 4 reply routing** scoped to the originating chat; `clickers` map extended with `chatId` so a button click in chat A no longer routes all future replies to the clicker's inbox globally
- **`getAll()` overloads** raised from 6 to 10 type parameters
- **`deepmerge` import workaround** annotated with an explanatory comment
- **`test:cjs` inline script** extracted to `scripts/verify-cjs.js`
- **`ignoreDeprecations: "6.0"`** in `tsconfig.json` annotated with a comment explaining what TypeScript 6.0 deprecations are being suppressed

## Capabilities

### New Capabilities

_None — this change contains only fixes and internal refactoring._

### Modified Capabilities

- `outgoing-requests-capture`: `requests` field becomes a readonly getter; `clear()` implementation changes internally — external read access is preserved
- `chats-orchestrator`: Rule 4 reply routing scoped to chat; `pollStateCounter` becomes instance state
- `bot-test-harness`: `IdGenerator` gains `nextUpdateId()`; `Group`, `Supergroup`, `Channel` receive `ids` at construction

## Impact

- **`src/high-level/`**: `id-generator.ts`, `chats.ts`, `dispatch.ts`, `group.ts`, `supergroup.ts`, `channel.ts`, `business-account.ts`
- **`src/low-level/outgoing-requests.ts`**: field visibility change
- **`src/low-level/updates/generic-mock.update.ts`**: deepmerge comment only
- **`tsconfig.json`**, **`package.json`**, **`jsr.json`**, **`.github/workflows/ci.yml`**, **`README.md`**: config/doc changes
- **`scripts/verify-cjs.js`**: new file (extracted from inline `package.json` script)
- No public API additions; `outgoing.requests` getter preserves the read interface; no breaking changes for consumers
