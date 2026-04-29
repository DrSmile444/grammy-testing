## 1. PrivateChat messages log

- [x] 1.1 Add `messages: MessagesLog<TContext>` public field to `PrivateChat` in `src/high-level/private-chat.ts`
- [x] 1.2 Import `MessagesLog` in `private-chat.ts`
- [x] 1.3 Initialize `chat.messages = new MessagesLog<TContext>()` inside `Chats.privateChatFor` in `src/high-level/chats.ts` (after constructing the `PrivateChat` instance)
- [x] 1.4 Remove the private-chat skip block in `Chats.deriveFromCapture` so private chats also get `chat.messages.push(reply)` like all other chat types

## 2. parse-mode spec correction (v1 → v2)

- [x] 2.1 Update the `grammy-plugin-interop` delta spec to MODIFIED — replace stale v1 `replyWithHTML`/`replyFmt` requirement with accurate v2 entity-based description
- [x] 2.2 No new test code needed — existing `tests/plugins/parse-mode.spec.ts` already covers the v2 entity-based scenarios

## 3. Reference test for privateChat.messages

- [x] 3.1 Add a test in `tests/reference/` (or extend an existing suite) verifying that a private DM lands in both `privateChat.messages` and `user.replies`

## 4. Quality gate

- [x] 4.1 Run `npm run typecheck` — passes
- [x] 4.2 Run `npm run lint` — passes
- [x] 4.3 Run `npm run test:run` — passes
- [x] 4.4 Run `npm run test:coverage` — passes at 80%+

## 5. Versioning

- [x] 5.1 Bump `version` in `package.json` from `0.5.0` to `0.5.1` (patch — spec compliance fix, no API changes)
