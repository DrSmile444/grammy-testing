# auto-derived-api-responses Specification

## Purpose

Requirements for the automatic derivation of `getChatMember`, `getChatAdministrators`, and `getChat` responses from the `Chats` orchestrator's own membership state, eliminating the need for manual `responses` mocking in common test setups.

## Requirements

### Requirement: `getChatMember` auto-resolves from membership state

The system SHALL auto-derive the `getChatMember` response from the registered chat's members map in `buildDefaultResponses()`. When the bot calls `getChatMember({ chat_id, user_id })`:

- If `chat_id` is not a registered chat, the resolver SHALL return `true` (preserving existing default behaviour).
- If the chat has no `members` map (e.g. a private chat), the resolver SHALL return `true`.
- If `user_id` is found in `chat.members`, the resolver SHALL return a typed `ChatMember` discriminated union derived from the `Membership` record:
  - `'creator'` → `ChatMemberOwner` with `is_anonymous` from `permissions.is_anonymous ?? false`
  - `'administrator'` → `ChatMemberAdministrator` with `is_anonymous`, `can_be_edited`, and all other permission flags from `permissions`
  - `'member'` → `ChatMemberMember`
  - `'restricted'` → `ChatMemberRestricted` with `is_member`, `until_date`, and restriction flags from `permissions`
  - `'left'` → `ChatMemberLeft`
  - `'kicked'` → `ChatMemberBanned` with `until_date`
- If `user_id` is not in `chat.members`, the resolver SHALL return `{ status: 'left', user: <User actor if registered, else synthetic { id: user_id, is_bot: false, first_name: 'Unknown' }> }`.
- The `User` actor SHALL be used directly as the `user` field (it is structurally compatible with the Telegram `User` interface).

#### Scenario: getChatMember returns creator for own() user

- **WHEN** a test calls `group.own(user)` then triggers a bot handler that calls `getChatMember({ chat_id: group.id, user_id: user.id })`
- **THEN** the resolved result has `status` equal to `'creator'`
- **AND** `result.user.id` equals `user.id`

#### Scenario: getChatMember returns administrator for promote() user

- **WHEN** a test calls `group.promote(user)` then triggers a bot handler that calls `getChatMember({ chat_id: group.id, user_id: user.id })`
- **THEN** the resolved result has `status` equal to `'administrator'`

#### Scenario: getChatMember returns member for join() user

- **WHEN** a test calls `group.join(user)` then triggers a bot handler that calls `getChatMember({ chat_id: group.id, user_id: user.id })`
- **THEN** the resolved result has `status` equal to `'member'`

#### Scenario: getChatMember returns left for unknown user

- **WHEN** the bot calls `getChatMember({ chat_id: group.id, user_id: 99999 })` for a user not in the members map
- **THEN** the resolved result has `status` equal to `'left'`

#### Scenario: getChatMember falls back to true for unregistered chat

- **WHEN** the bot calls `getChatMember({ chat_id: 9999, user_id: user.id })` for a chat not registered with the `Chats` instance
- **THEN** the resolved result is `true`

### Requirement: `getChatAdministrators` auto-resolves from membership state

The system SHALL auto-derive the `getChatAdministrators` response from the registered chat's members map in `buildDefaultResponses()`. When the bot calls `getChatAdministrators({ chat_id })`:

- If `chat_id` is not a registered chat or the chat has no `members` map, the resolver SHALL return `[]`.
- Otherwise the resolver SHALL return an array of `ChatMemberOwner | ChatMemberAdministrator` objects for every entry in `chat.members` whose status is `'creator'` or `'administrator'`, using the same `Membership` → `ChatMember` conversion as `getChatMember`.

#### Scenario: getChatAdministrators returns owner and admins

- **WHEN** a test calls `group.own(owner)` and `group.promote(admin)`
- **AND** the bot calls `getChatAdministrators({ chat_id: group.id })`
- **THEN** the result is an array of length 2
- **AND** one entry has `status` equal to `'creator'`
- **AND** one entry has `status` equal to `'administrator'`

#### Scenario: getChatAdministrators excludes plain members

- **WHEN** a test calls `group.join(member)` and `group.own(owner)`
- **AND** the bot calls `getChatAdministrators({ chat_id: group.id })`
- **THEN** the result contains only the owner (length 1)
- **AND** the member is not in the result

#### Scenario: getChatAdministrators returns empty array for unregistered chat

- **WHEN** the bot calls `getChatAdministrators({ chat_id: 9999 })` for an unregistered chat
- **THEN** the result is an empty array

### Requirement: `getChat` auto-resolves from registered chat state

The system SHALL auto-derive the `getChat` response from `chat.toTelegramChat()` enriched with `invite_link: ''` in `buildDefaultResponses()`. When the bot calls `getChat({ chat_id })`:

- If `chat_id` is not a registered chat, the resolver SHALL return `true`.
- Otherwise the resolver SHALL return `{ ...chat.toTelegramChat(), invite_link: '' }`.
- `invite_link` SHALL be `''` (empty string): falsy for `if (invite_link)` guards; key is present for `'invite_link' in chat` checks.

#### Scenario: getChat returns enriched chat shape

- **WHEN** the bot calls `getChat({ chat_id: group.id })` for a registered group
- **THEN** the result contains `id` equal to `group.id`
- **AND** `result.type` equals `'supergroup'` (or `'group'` for Group)
- **AND** `result.invite_link` equals `''`

#### Scenario: getChat falls back to true for unregistered chat

- **WHEN** the bot calls `getChat({ chat_id: 9999 })` for an unregistered chat
- **THEN** the result is `true`

### Requirement: User-supplied `responses` override auto-derived defaults

The system SHALL ensure that any entry in the `responses` option passed to `prepareBot`, `prepareComposer`, or `prepareMiddleware` takes precedence over the auto-derived defaults for `getChatMember`, `getChatAdministrators`, and `getChat`. This is guaranteed by the existing spread: `{ ...buildDefaultResponses(), ...options.responses }`.

#### Scenario: Manual getChatMember response overrides auto-derived

- **WHEN** a test passes `responses: { getChatMember: { status: 'restricted', ... } }` to `prepareBot`
- **AND** the bot calls `getChatMember` for a user who is an administrator in the members map
- **THEN** the resolved result reflects the manually supplied `'restricted'` shape, not the auto-derived `'administrator'` shape

### Requirement: Managed-bot methods resolve with static synthetic defaults

`buildDefaultResponses()` SHALL resolve each Bot API 10.0 managed-bot method with a static,
type-correct default when no user-supplied `responses` entry is present:

- `getManagedBotAccessSettings` → a `BotAccessSettings`-shaped object.
- `setManagedBotAccessSettings` → `true`.
- `getManagedBotToken` and `replaceManagedBotToken` → a non-empty token `string` (their Telegram
  return type is a bare string).

User-supplied `responses` entries SHALL override these defaults (guaranteed by the existing
`{ ...buildDefaultResponses(), ...options.responses }` spread).

#### Scenario: getManagedBotAccessSettings returns a default settings object

- **WHEN** the bot calls `ctx.api.getManagedBotAccessSettings({ ... })`
- **AND** no `responses.getManagedBotAccessSettings` entry is configured
- **THEN** the resolved result is a `BotAccessSettings`-shaped object

#### Scenario: setManagedBotAccessSettings resolves with true

- **WHEN** the bot calls `ctx.api.setManagedBotAccessSettings({ ... })`
- **THEN** the resolved result is `true`

### Requirement: `getUserPersonalChatMessages` resolves with an empty `Message[]` by default

The resolver SHALL return an empty array (`[]`) for `getUserPersonalChatMessages` by default when
no user-supplied `responses` entry is present, matching the `Message[]` return type.

#### Scenario: getUserPersonalChatMessages returns an empty array

- **WHEN** the bot calls `ctx.api.getUserPersonalChatMessages({ ... })`
- **AND** no `responses.getUserPersonalChatMessages` entry is configured
- **THEN** the resolved result is an empty array

### Requirement: `getChatAdministrators` honors the `return_bots` parameter

The auto-derived `getChatAdministrators` resolver SHALL continue to return owner and administrator
entries from the chat's members map. When the payload sets `return_bots: false`, the resolver
SHALL exclude entries whose `user.is_bot` is `true`. When `return_bots` is absent or `true`, the
result SHALL be unchanged from the existing behavior.

#### Scenario: return_bots false excludes bot administrators

- **WHEN** a group has a human admin and a bot admin in its members map
- **AND** the bot calls `getChatAdministrators({ chat_id, return_bots: false })`
- **THEN** the result contains only the human admin
