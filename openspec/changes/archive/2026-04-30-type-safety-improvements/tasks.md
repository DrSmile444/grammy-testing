## 1. Dead code removal

- [x] 1.1 Remove the `export type Union` declaration and `const unionMap: Record<Union, number>` block from the bottom of `src/high-level/chats.ts`

## 2. ParseMode — import from grammy

- [x] 2.1 Delete the local `export type ParseMode = ...` definition in `src/high-level/reply.ts`
- [x] 2.2 Add `ParseMode` to the existing `import type { ... } from 'grammy/types'` statement in `reply.ts`
- [x] 2.3 Verify `Reply.parseMode` accessor still type-checks correctly (no type error on the assignment in the accessor body)

## 3. assertNever utility

- [x] 3.1 Add an `assertNever` function at module scope in `src/high-level/dispatch.ts` with signature `function assertNever(x: never): never`

## 4. Harden makeChatMember switch

- [x] 4.1 Separate the `'kicked'` case from the `default` case in `makeChatMember` so `'kicked'` has its own explicit `case` block
- [x] 4.2 Replace the remaining `default:` body with `return assertNever(status)` so unknown statuses produce a compile error

## 5. Exhaustive MEDIA_FIELDS guard

- [x] 5.1 Add a `const MEDIA_FIELDS_GUARD: Record<MediaType, true>` object in `reply.ts` listing all 8 current `MediaType` members (all mapped to `true`)
- [x] 5.2 Replace the existing `const MEDIA_FIELDS: MediaType[]` array literal with `const MEDIA_FIELDS = Object.keys(MEDIA_FIELDS_GUARD) as MediaType[]`
- [x] 5.3 Confirm `deriveMedia` still returns the correct media type for photo, video, document, and audio in the test suite

## 6. Quality gate

- [x] 6.1 Run `npm run typecheck` — exits 0
- [x] 6.2 Run `npm run lint` — exits 0 (no new errors)
- [x] 6.3 Run `npm run test:run` — all tests pass
- [x] 6.4 Run `npm run test:coverage` — coverage stays at or above 80%
