## Why

The codebase contains a hand-copied `ParseMode` union that duplicates grammy's own type, a `MediaType` union whose downstream array `MEDIA_FIELDS` gives no compile-time signal when the union grows, a `makeChatMember` switch with a silent `default` that would swallow any new grammy `ChatMemberStatus` variant as `'kicked'`, and a stray `Union`/`unionMap` example block that was accidentally committed to `chats.ts`. Together these mean grammy upstream changes can silently misalign with this library without a single TypeScript error.

## What Changes

- Remove dead `Union` type export and `unionMap` constant from `src/high-level/chats.ts`
- Replace the local `ParseMode` definition in `src/high-level/reply.ts` with `import type { ParseMode } from 'grammy/types'`
- Add a shared `assertNever` utility (one function, no new file needed — inline where used or in a small `src/utils.ts`)
- Fix `makeChatMember` in `src/high-level/dispatch.ts`: make `'kicked'` an explicit case and replace `default` with `assertNever(status)` so any future grammy status variant breaks the build immediately
- Convert `MEDIA_FIELDS` in `src/high-level/reply.ts` from a plain `MediaType[]` to an exhaustive `Record<MediaType, true>` guard, then derive the runtime array from `Object.keys`

## Capabilities

### New Capabilities

- `type-safety`: Compile-time exhaustiveness guarantees for union-driven dispatch — `assertNever`, exhaustive record guards, and upstream-type imports

### Modified Capabilities

- `reply-objects`: `ParseMode` is now sourced from grammy (same value, stricter provenance); `MediaType` exhaustiveness rule added

## Impact

- `src/high-level/chats.ts` — dead code removed (no behaviour change)
- `src/high-level/reply.ts` — `ParseMode` import swapped; `MEDIA_FIELDS` converted to exhaustive guard
- `src/high-level/dispatch.ts` — `makeChatMember` switch hardened
- `src/utils.ts` (new, optional) — `assertNever` helper, or inlined into `dispatch.ts`
- No public API changes; no version bump required (patch-only internal cleanup)
