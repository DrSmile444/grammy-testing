## Context

Five concrete issues were identified during an exploration session:

1. **Dead code**: `export type Union` and `const unionMap: Record<Union, number>` were accidentally committed to `src/high-level/chats.ts` as a demonstrative example. They are exported but unused.
2. **Duplicated type**: `ParseMode = 'HTML' | 'Markdown' | 'MarkdownV2'` in `reply.ts` is a hand-copy of `grammy/types`'s own `ParseMode`. Both are identical today, but drift silently if grammy adds or removes a parse mode.
3. **Non-exhaustive array**: `const MEDIA_FIELDS: MediaType[]` in `reply.ts` is a plain array — TypeScript accepts it even if `MediaType` grows. A new media type would be silently ignored by `deriveMedia()`, breaking `Reply.media`.
4. **Swallowed default**: `makeChatMember` in `dispatch.ts` ends with `case 'kicked': default:` — any future grammy `ChatMember` variant would silently be constructed as a `'kicked'` member.
5. **`assertNever` pattern absent**: The codebase has no utility to enforce exhaustive switches at the type level.

## Goals / Non-Goals

**Goals:**
- Remove all dead code introduced by the example
- Make `ParseMode` track grammy upstream automatically
- Make `MEDIA_FIELDS` a compile-time-checked exhaustive record
- Make `makeChatMember` reject unknown statuses at the type level
- Introduce `assertNever` as the standard exhaustiveness tool

**Non-Goals:**
- Exhaustiveness on `AnyChat` branches — those are binary (private vs. non-private) today and not a practical risk
- Converting every union in the codebase — only the three concrete gaps identified
- Any public API or behaviour change

## Decisions

### `assertNever` placement — inline in `dispatch.ts`, not a shared utils file

The function is one line: `function assertNever(x: never): never { throw new Error(...) }`. The codebase currently has no `src/utils.ts` and introducing one for a single helper adds structural overhead. `dispatch.ts` is the only caller today. If a second caller appears, extract to `src/utils.ts` at that point.

Alternative considered: create `src/utils.ts` now. Rejected: premature; adds a file for a one-liner with one call site.

### `MEDIA_FIELDS` guard shape — `Record<MediaType, true>` then `Object.keys`

```typescript
const MEDIA_FIELDS_GUARD: Record<MediaType, true> = {
  animation: true, audio: true, document: true, photo: true,
  sticker:   true, video: true, video_note: true, voice: true,
};
const MEDIA_FIELDS = Object.keys(MEDIA_FIELDS_GUARD) as MediaType[];
```

The `Record<MediaType, true>` forces every member to be listed; omitting one is a compile error. `Object.keys` then produces the runtime array at zero cost. The `as MediaType[]` cast is safe because we just proved exhaustiveness above it.

Alternative considered: `satisfies Record<MediaType, true>` on the existing array literal — rejected because `satisfies` on an array doesn't enforce key completeness.

Alternative considered: a type-level `Exclude<MediaType, typeof MEDIA_FIELDS[number]>` assertion — rejected as arcane compared to a plain Record.

### `makeChatMember` — explicit `'kicked'` + `assertNever` on default

Replace:
```typescript
case 'kicked':
default: { return { status: 'kicked', ... }; }
```
With:
```typescript
case 'kicked': { return { status: 'kicked', ... }; }
default: { return assertNever(status); }
```

TypeScript narrows `status` to `never` by the time it reaches `default`, so the `assertNever` call type-checks only when the switch is exhaustive. Adding a new `ChatMemberStatus` variant in grammy (e.g., a future `'subscriber'`) makes this a compile error, not a silent misclassification.

### `ParseMode` — swap to `import type { ParseMode } from 'grammy/types'`

`reply.ts` already imports from `grammy/types` for other types. Swapping the local definition to an import is one line. The actual string union is identical today, so no runtime change.

## Risks / Trade-offs

- **`assertNever` throws at runtime** — if somehow a test dispatches an invalid status string (e.g. via `as` cast bypassing types), the throw will surface as a test failure rather than silently returning a wrong value. This is strictly better behaviour.
- **`Object.keys` order is insertion order for string keys** — the order of `MEDIA_FIELDS` at runtime may change compared to today's explicit array literal. `deriveMedia()` iterates and returns the first match, so order matters only if a message payload has two media fields simultaneously (impossible in real Telegram data). No practical risk.
- **grammy `ParseMode` re-export** — if grammy ever gates `ParseMode` behind a conditional export, our import breaks. Given grammy's stability this is theoretical; the upside (automatic tracking) outweighs it.
