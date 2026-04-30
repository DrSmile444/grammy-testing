## 1. BusinessAccount actor

- [x] 1.1 Create `src/high-level/business-account.ts` with `BusinessAccount` class, module-level connection counter, and `connectionId` / `user` properties
- [x] 1.2 Implement `connect(options?)` — dispatches `business_connection` with `is_enabled: true` at base `1_700_000`
- [x] 1.3 Implement `disconnect(options?)` — dispatches `business_connection` with `is_enabled: false` (same counter as connect)
- [x] 1.4 Implement `sendMessage(text, options?)` — dispatches `business_message` at base `1_710_000`
- [x] 1.5 Implement `editMessage(messageId, newText, options?)` — dispatches `edited_business_message` at base `1_720_000`
- [x] 1.6 Implement `deleteMessages(messageIds, options?)` — dispatches `deleted_business_messages` at base `1_730_000`

## 2. Chats orchestrator extensions

- [x] 2.1 Add `newBusinessAccount(user)` factory to `src/high-level/chats.ts` — imports `BusinessAccount` and returns a new instance
- [x] 2.2 Add `dispatchPollState(poll, options?)` to `Chats` — dispatches `poll` update at base `1_770_000`

## 3. User actor extensions

- [x] 3.1 Add `manageBot(botUser, options?)` to `src/high-level/user.ts` — dispatches `managed_bot` at base `1_740_000`; export `ManageBotOptions` interface
- [x] 3.2 Add `purchasePaidMedia(payload, options?)` to `src/high-level/user.ts` — dispatches `purchased_paid_media` at base `1_750_000`; export `PurchasePaidMediaOptions` interface

## 4. Chat actor extensions

- [x] 4.1 Add `dispatchReactionCount(messageId, reactions, options?)` to `src/high-level/group.ts` at base `1_760_000`; export `DispatchReactionCountOptions` interface from types
- [x] 4.2 Add `dispatchReactionCount` to `src/high-level/supergroup.ts` (same signature and base)
- [x] 4.3 Add `dispatchReactionCount` to `src/high-level/channel.ts` (same signature and base)

## 5. Exports and types

- [x] 5.1 Export all new option interfaces (`ManageBotOptions`, `PurchasePaidMediaOptions`, `DispatchReactionCountOptions`, `DispatchPollStateOptions`, and business-account option types) from `src/index.ts`
- [x] 5.2 Export `BusinessAccount` class from `src/index.ts`

## 6. Tests

- [x] 6.1 Create `tests/reference/business-api.spec.ts` covering `connect`, `disconnect`, `sendMessage`, `editMessage`, and `deleteMessages`
- [x] 6.2 Add tests for `user.manageBot` and `user.purchasePaidMedia` to the existing reference suite
- [x] 6.3 Add tests for `group.dispatchReactionCount`, `channel.dispatchReactionCount`, and `chats.dispatchPollState` to the existing reference suite

## 7. Documentation and version

- [x] 7.1 Remove all eight entries from the "Not covered" table in `README.md` (or remove the section entirely if empty)
- [x] 7.2 Bump version `0.6.0 → 0.7.0` in `package.json`
