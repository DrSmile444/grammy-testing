## Why

The framework covers classic Telegram update types (messages, callbacks, inline queries, payments) but lacks dispatch verbs for the Bot API 7+ update types that modern bots rely on: reactions, poll votes, member status changes, join requests, edited channel posts, and chat boosts. Tests for these bot features currently require raw `bot.handleUpdate()` calls with hand-built payloads — no high-level verbs exist.

The Business API update types (`business_connection`, `business_message`, `edited_business_message`, `deleted_business_messages`, `managed_bot`) are **intentionally excluded** from this change and from the framework scope — they require a verified Telegram Business account and represent a narrow use case not covered by the standard Bot API test surface. This exclusion is documented in README so it is discoverable.

## What Changes

- Add `user.reactTo(reply, reaction)` — dispatches `message_reaction`
- Add `user.answerPoll(reply, optionIndices)` — dispatches `poll_answer`
- Add `user.requestJoin(group)` — dispatches `chat_join_request`
- Add `group.dispatchMemberUpdate(adminUser, targetUser, newStatus, options?)` on `Group` and `Supergroup` — dispatches `chat_member`
- Add `channel.editPost(messageId, newText, options?)` — dispatches `edited_channel_post`
- Add `user.boostChat(chat)` — dispatches `chat_boost`
- Add `user.removeBoost(chat, boostId)` — dispatches `removed_chat_boost`
- Document the intentional Business API scope exclusion in `README.md`
- Minor version bump: `0.5.1 → 0.6.0`

## Capabilities

### New Capabilities

- `modern-update-types`: dispatch verbs for Bot API 7+ update types — reactions, poll answers, chat member changes, join requests, edited channel posts, and chat boosts

### Modified Capabilities

- `user-actor`: extended with `reactTo`, `answerPoll`, `requestJoin`, `boostChat`, `removeBoost` verbs
- `special-message-verbs`: `chat_join_request` is a non-message update type alongside the existing special verbs

## Impact

- `src/high-level/user.ts` — five new methods + option interfaces
- `src/high-level/group.ts` and `src/high-level/supergroup.ts` — `dispatchMemberUpdate` method
- `src/high-level/channel.ts` — `editPost` method
- `src/index.ts` — export new option types
- `README.md` — Business API exclusion note
- Minor version bump: `0.5.1 → 0.6.0`
