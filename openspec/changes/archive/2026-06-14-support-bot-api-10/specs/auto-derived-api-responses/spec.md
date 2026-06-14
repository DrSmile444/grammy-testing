## ADDED Requirements

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
