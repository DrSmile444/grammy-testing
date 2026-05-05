## Why

Tests that exercise bot logic around `getChatMember`, `getChatAdministrators`, or `getChat` must manually duplicate raw Telegram API shapes in the `responses` option — even though the library already holds all the data needed to answer those calls from its own membership state. There is also no way to designate a user as a group owner (`'creator'`) or plain member (`'member'`) without triggering bot middleware, making clean test setup impossible for bots that call these APIs.

## What Changes

- **New** `group.own(user)` and `supergroup.own(user)` — pure state setter for `'creator'` status, no update dispatched
- **New** `group.join(user)` and `supergroup.join(user)` — pure state setter for `'member'` status, no update dispatched
- **New** `chats.newOwner(profile?)` — creates a user and calls `defaultGroup.own(user)`, mirroring `newAdmin()`
- **New** `getChatMember` auto-derived from `chat.members` in `buildDefaultResponses()`
- **New** `getChatAdministrators` auto-derived from `chat.members` (filters `'creator'` and `'administrator'`)
- **New** `getChat` auto-derived from `chat.toTelegramChat()` enriched with `invite_link: ''`
- **Resolved** `TODO.md` items 13, 14, 15 marked as resolved (already done; TODO was stale)
- **Resolved** `TODO.md` items 16, 17 marked as resolved after implementation

## Capabilities

### New Capabilities

- `auto-derived-api-responses`: `getChatMember`, `getChatAdministrators`, and `getChat` resolve automatically from registered chat membership state — no manual `responses` mocking needed for common cases

### Modified Capabilities

- `membership-roles`: Adds `own()` and `join()` as pure state setters for `'creator'` and `'member'` status (alongside existing `promote()` and `restrict()`), and `chats.newOwner()` as a convenience factory

## Impact

- `src/high-level/group.ts` — new `own()`, `join()` methods
- `src/high-level/supergroup.ts` — new `own()`, `join()` methods
- `src/high-level/chats.ts` — new `newOwner()`, module-level `membershipToChatMember()` helper, three new resolvers in `buildDefaultResponses()`
- `TODO.md` — stale items marked resolved
- No new public exports required; no breaking changes
- User-supplied `responses` overrides continue to take precedence (spread order unchanged)
