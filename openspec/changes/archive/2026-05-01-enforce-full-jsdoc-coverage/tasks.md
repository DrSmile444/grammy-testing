## 1. ESLint Config

- [x] 1.1 Add `MethodDefinition: true`, `ClassDeclaration: true`, `ArrowFunctionExpression: true`, `FunctionExpression: true` to `require-jsdoc` in `.eslint/node/jsdoc.eslint.mjs`
- [x] 1.2 Verify `npm run lint` now surfaces all ~121 violations (confirms rule is active)

## 2. JSDoc — High-level core (68 violations)

- [x] 2.1 Add JSDoc to all methods in `src/high-level/user.ts` (29 violations)
- [x] 2.2 Add JSDoc to all methods in `src/high-level/chats.ts` (20 violations)
- [x] 2.3 Add JSDoc to all methods in `src/high-level/id-generator.ts` (8 violations)
- [x] 2.4 Add JSDoc to all methods in `src/high-level/messages-log.ts` (6 violations)

## 3. JSDoc — High-level chat types (19 violations)

- [x] 3.1 Add JSDoc to all methods in `src/high-level/group.ts` (6 violations)
- [x] 3.2 Add JSDoc to all methods in `src/high-level/supergroup.ts` (6 violations)
- [x] 3.3 Add JSDoc to all methods in `src/high-level/channel.ts` (4 violations)
- [x] 3.4 Add JSDoc to all methods in `src/high-level/private-chat.ts` (3 violations)

## 4. JSDoc — Remaining high-level files (4 violations)

- [x] 4.1 Add JSDoc to all methods in `src/high-level/reply.ts` (3 violations)
- [x] 4.2 Add JSDoc to all methods in `src/high-level/business-account.ts` (1 violation)

## 5. JSDoc — Low-level core (22 violations)

- [x] 5.1 Add JSDoc to all methods in `src/low-level/outgoing-requests.ts` (19 violations)
- [x] 5.2 Add JSDoc to all methods in `src/low-level/mock-context-fields.ts` (2 violations)
- [x] 5.3 Add JSDoc to all methods in `src/low-level/mock-context-field.ts`, `src/low-level/idle.ts`, `src/low-level/prepare-bot.ts` (1 violation each)

## 6. JSDoc — Low-level update builders (11 violations)

- [x] 6.1 Add JSDoc to `src/low-level/updates/left-member-mock.update.ts` (2 violations)
- [x] 6.2 Add JSDoc to `src/low-level/updates/message-private-mock.update.ts` (2 violations)
- [x] 6.3 Add JSDoc to `src/low-level/updates/message-super-group-mock.update.ts` (2 violations)
- [x] 6.4 Add JSDoc to `src/low-level/updates/my-chat-member-mock.update.ts` (2 violations)
- [x] 6.5 Add JSDoc to `src/low-level/updates/new-member-mock.update.ts` (2 violations)
- [x] 6.6 Add JSDoc to `src/low-level/updates/generic-mock.update.ts` (1 violation)

## 7. Verification

- [x] 7.1 Run `npm run lint` — confirm 0 errors
- [x] 7.2 Run `npm run typecheck` — confirm no regressions
- [x] 7.3 Run `npm test` — confirm all tests pass
