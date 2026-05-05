## Why

The framework's README explicitly documents eight update types as "Not covered"; this change covers all of them, removing the exclusion notice for each once an ergonomic dispatch verb exists. Bots using Telegram Business accounts, paid media, reaction aggregates, and autonomous poll updates currently cannot test those code paths with the high-level API.

## What Changes

- Introduce `BusinessAccount` high-level actor with verbs for all Business API update types:
  - `connect(options?)` → `business_connection` (is_enabled: true)
  - `disconnect(options?)` → `business_connection` (is_enabled: false)
  - `sendMessage(text, options?)` → `business_message`
  - `editMessage(messageId, newText, options?)` → `edited_business_message`
  - `deleteMessages(messageIds, options?)` → `deleted_business_messages`
- Add `user.manageBot(botUser, options?)` → `managed_bot`
- Add `user.purchasePaidMedia(payload, options?)` → `purchased_paid_media`
- Add `chat.dispatchReactionCount(messageId, reactions, options?)` on `Group`, `Supergroup`, and `Channel` → `message_reaction_count`
- Add `chats.dispatchPollState(poll, options?)` on the `Chats` orchestrator → `poll`
- Remove all newly-covered types from the "Not covered" section in `README.md`
- Export all new option interfaces from `src/index.ts`
- Minor version bump: `0.6.0 → 0.7.0`

## Capabilities

### New Capabilities

- `business-api`: Full set of Business API dispatch verbs (`business_connection`, `business_message`, `edited_business_message`, `deleted_business_messages`) plus `managed_bot`, all grouped under the `BusinessAccount` actor

### Modified Capabilities

- `user-actor`: Extended with `purchasePaidMedia` and `manageBot` verbs
- `modern-update-types`: Extended with `message_reaction_count` (on chat actors) and `poll` state (on `Chats` orchestrator)

## Impact

- `src/high-level/business-account.ts` — new file: `BusinessAccount` class
- `src/high-level/chats.ts` — `newBusinessAccount(user)` factory + `dispatchPollState` method
- `src/high-level/group.ts` — `dispatchReactionCount` method
- `src/high-level/supergroup.ts` — `dispatchReactionCount` method
- `src/high-level/channel.ts` — `dispatchReactionCount` method
- `src/high-level/user.ts` — `purchasePaidMedia`, `manageBot` methods
- `src/index.ts` — new exports
- `README.md` — "Not covered" section emptied (all types now covered)
- `package.json` — version `0.6.0 → 0.7.0`
