## ADDED Requirements

### Requirement: Hero landing page

`site/index.md` SHALL use the VitePress `home` layout with a hero section, feature highlights,
and quick-start code snippet. It SHALL include badges for npm version and license.

#### Scenario: Hero page renders with correct content

- **WHEN** a user visits the root URL
- **THEN** they see the grammy-testing logo, tagline, and two CTA buttons: "Get Started" and "API Reference"

#### Scenario: Feature cards describe core capabilities

- **WHEN** a user scrolls below the hero
- **THEN** four feature cards appear: "In-Process Testing", "Real Bot, No Network", "Two-Layer API", "Works With Any Framework"

### Requirement: Guide — Introduction page

`site/guide/introduction.md` SHALL explain what the library is, what problem it solves (testing
Telegram bots without real tokens/network), and how it relates to grammY. It SHALL link to the
Getting Started page and include a brief architecture diagram (ASCII).

#### Scenario: Introduction page covers the problem statement

- **WHEN** a user reads the introduction
- **THEN** they understand why in-process testing is preferable to live bot testing

#### Scenario: Architecture overview is present

- **WHEN** a user reads the introduction
- **THEN** an ASCII or fenced diagram shows the Bot → Transformer → Capture flow

### Requirement: Guide — Getting Started page

`site/guide/getting-started.md` SHALL walk a new user from `npm install` to their first passing
test in under five minutes. It SHALL show a complete, runnable Vitest example including
`prepareBot`, `chats.newUser()`, `user.sendText()`, and assertion on `user.replies.lastOrThrow()`.

#### Scenario: Install command is shown

- **WHEN** a user reads Getting Started
- **THEN** the npm install command for `grammy-testing` and `grammy` is shown

#### Scenario: First test example is complete and runnable

- **WHEN** a user copies the first test example
- **THEN** it runs without modification in a project with Vitest and grammY installed

### Requirement: Guide — How It Works page

`site/guide/how-it-works.md` SHALL explain the transformer pattern (API call interception), the
`idle()` promise tracker, the two-layer design (high-level vs low-level), and the
`onCapture` hook. It SHALL call out that `setTimeout`-based async work is NOT tracked by `idle()`.

#### Scenario: Idle tracking limitation is documented

- **WHEN** a user reads "How It Works"
- **THEN** they find an explicit callout that fire-and-forget via `setTimeout` is not tracked

### Requirement: Guide — Framework setup pages

Three pages SHALL exist: `site/guide/with-vitest.md`, `site/guide/with-jest.md`, and
`site/guide/with-deno.md`. Each SHALL show the minimal config/import setup needed to use the
library with that test runner, including any CommonJS/ESM considerations for Jest. During the
third-party phase, the Deno page is a stub: it SHALL show consuming the package via the
`npm:grammy-testing` specifier and SHALL note that native Deno/JSR support arrives with the
official `@grammyjs/testing` release.

#### Scenario: Jest ESM note is present

- **WHEN** a user reads "With Jest"
- **THEN** they see a note about enabling ESM transforms (e.g. `--experimental-vm-modules`)

#### Scenario: Deno npm import is shown

- **WHEN** a user reads "With Deno"
- **THEN** the `npm:grammy-testing` import is shown
- **AND** a note states that native Deno/JSR support arrives with the official release

### Requirement: High-Level API — Overview page

`site/high-level/overview.md` SHALL explain the two-layer design philosophy, show a diagram of
the Chats orchestrator connecting to User/Group/Channel actors and their respective logs, and
guide the reader toward the most relevant page for their use case.

#### Scenario: Two-layer diagram is present

- **WHEN** a user reads the High-Level overview
- **THEN** a diagram (ASCII or fenced block) shows Chats → Users → Replies and Chats → Groups → Messages

### Requirement: High-Level API — Chats page

`site/high-level/chats.md` SHALL document all factory methods (`newUser`, `newAdmin`, `newOwner`,
`newGroup`, `newSupergroup`, `newChannel`, `newPrivateChat`, `newBusinessAccount`), accessor
methods (`repliesFor`, `actionsFor`, `editsFor`, `deletionsFor`), `clear()`, `idle()`, and
`outgoing`. Each method SHALL show its TypeScript signature and a code example.

#### Scenario: All factory methods are documented

- **WHEN** a user reads the Chats page
- **THEN** every public method on the Chats class has a signature block and example

### Requirement: High-Level API — User page

`site/high-level/user.md` SHALL document all 50+ dispatch methods on the `User` class, organised
into groups: Text & Commands, Media, Special Content, Group/Service Events, Inline & Callback,
Reactions & Polls, Payment, and Bot Management. Each group SHALL have a code example.

#### Scenario: sendText is documented with options

- **WHEN** a user reads the User page
- **THEN** `sendText` shows the `SendTextOptions` type including `chat`, `reply_to_message`, `anonymous`, and `parse_mode`

#### Scenario: All 50+ methods are listed

- **WHEN** a user reads the User page
- **THEN** no public method on `User` is missing from the documentation

### Requirement: High-Level API — Groups page

`site/high-level/groups.md` SHALL document `Group` and `Supergroup` classes including membership
management (`join`, `own`, `promote`, `restrict`), `dispatchMemberUpdate`,
`dispatchReactionCount`, `postRelayMessage`, and `sendSystemMessage`. It SHALL explain the
difference between `Group` and `Supergroup`.

#### Scenario: Promote example shown

- **WHEN** a user reads the Groups page
- **THEN** a code example demonstrates promoting a user to admin with custom permissions

### Requirement: High-Level API — Channel page

`site/high-level/channels.md` SHALL document `Channel` including `postMessageTo`, `editPost`,
`changeMemberStatus`, `dispatchReactionCount`, and `sendSystemMessage`.

#### Scenario: Cross-chat posting is shown

- **WHEN** a user reads the Channel page
- **THEN** a code example demonstrates posting a channel message into a linked group

### Requirement: High-Level API — PrivateChat page

`site/high-level/private-chat.md` SHALL document `PrivateChat` including its relationship to
`User`, the `messages` log, and when to use `PrivateChat` vs `User.replies`.

#### Scenario: PrivateChat vs replies distinction is clear

- **WHEN** a user reads the PrivateChat page
- **THEN** the page explains that `privateChat.messages` tracks bot sends while `user.replies` tracks bot replies to that user

### Requirement: High-Level API — BusinessAccount page

`site/high-level/business-account.md` SHALL document the `BusinessAccount` class with
`connect`, `disconnect`, `sendMessage`, `editMessage`, and `deleteMessages`, each with a
typed signature and code example.

#### Scenario: Business connection example shown

- **WHEN** a user reads the BusinessAccount page
- **THEN** a code example shows the full connect → send → disconnect sequence

### Requirement: High-Level API — Reply page

`site/high-level/reply.md` SHALL document the `Reply` class including all accessors (`text`,
`parseMode`, `entities`, `buttons`, `replyMarkup`, `chat`, `messageId`, `raw`, `replyingTo`)
and the `clickButton()` method. It SHALL explain how Reply is obtained from `replies.lastOrThrow()`.

#### Scenario: clickButton flow is documented

- **WHEN** a user reads the Reply page
- **THEN** an example shows: send command → get reply → click button → assert on next reply

### Requirement: High-Level API — Logs page

`site/high-level/logs.md` SHALL document all five log types: `MessagesLog`, `RepliesInbox`,
`ActionsLog`, `EditsLog`, and `DeletionsLog`. For each: `.last`, `.all`, `.length`,
`.lastOrThrow()` (where available), and `.clear()`.

#### Scenario: All five log classes are documented

- **WHEN** a user reads the Logs page
- **THEN** MessagesLog, RepliesInbox, ActionsLog, EditsLog, and DeletionsLog each have their own section

### Requirement: Low-Level API — Overview page

`site/low-level/overview.md` SHALL explain when to reach for the low-level layer vs the
high-level API, list the exports available only from `grammy-testing/low-level`, and link
to each low-level page.

#### Scenario: Low-level subpath import is documented

- **WHEN** a user reads the Low-Level overview
- **THEN** it shows `import { GenericMockUpdate } from 'grammy-testing/low-level'`

### Requirement: Low-Level API — Outgoing Requests page

`site/low-level/outgoing-requests.md` SHALL document `OutgoingRequests` including all typed
accessors (`getMethods`, `getFirst`, `getLast`, `getTwoLast`, `getThreeLast`, `getAll`),
`push`, `clear`, `failNext`, `failAll`, `respondNext`, and `clearOverrides`. The TypeScript
overload signatures for `getAll` SHALL be shown.

#### Scenario: failNext error simulation example shown

- **WHEN** a user reads Outgoing Requests
- **THEN** a code example demonstrates `failNext`, triggering the error, then verifying recovery

### Requirement: Low-Level API — Session Mocking page

`site/low-level/session-mocking.md` SHALL document `mockSession`, `mockChatSession`, `mockState`,
and `mockContextField` with TypeScript signatures and one complete example each.

#### Scenario: mockSession mutation example shown

- **WHEN** a user reads Session Mocking
- **THEN** an example shows mutating `session.count` directly in a test and asserting on it

### Requirement: Low-Level API — Update Builders page

`site/low-level/update-builders.md` SHALL document all five mock update classes from the
`grammy-testing/low-level` subpath: `GenericMockUpdate`, `MessagePrivateMockUpdate`,
`MessageMockUpdate`, `NewMemberMockUpdate`, `LeftMemberMockUpdate`, `MyChatMemberMockUpdate`.
It SHALL explain when to use them over the high-level actor dispatch verbs.

#### Scenario: Use case distinction is clear

- **WHEN** a user reads Update Builders
- **THEN** the page explains that update builders are for edge-case update shapes not covered by User methods

### Requirement: Low-Level API — Response Mocking page

`site/low-level/response-mocking.md` SHALL document the `Responses` and `ResponseResolver`
types and show how to provide canned API responses via `prepareBot`'s `responses` option.

#### Scenario: Custom getChat response shown

- **WHEN** a user reads Response Mocking
- **THEN** an example shows providing a static `getChat` response via `prepareBot` options

### Requirement: Recipes section — seven pages

Seven recipe pages SHALL exist, each with a complete scenario drawn from the corresponding
example files in `examples/`. Each recipe SHALL include: context (what problem it solves),
the bot handler, and the full test file.

The seven recipes SHALL be:

1. `site/recipes/sessions-and-state.md` — `mockSession`, `mockChatSession`, `mockState`
2. `site/recipes/keyboards-and-buttons.md` — inline keyboards and `reply.clickButton()`
3. `site/recipes/error-simulation.md` — `failNext`, `failAll`, GrammyError handling
4. `site/recipes/multi-chat-scenarios.md` — multiple users, multiple chats, cross-chat state
5. `site/recipes/conversations-plugin.md` — `@grammyjs/conversations` v2 with `okFetch` pattern
6. `site/recipes/menu-plugin.md` — `@grammyjs/menu` with button click assertions
7. `site/recipes/fire-and-forget.md` — void API calls and `await chats.idle()`

#### Scenario: Conversations recipe covers the okFetch pattern

- **WHEN** a user reads the Conversations recipe
- **THEN** the page explains that `conversations` v2 requires an `okFetch` mock client and shows the exact setup

#### Scenario: Fire-and-forget recipe explains idle()

- **WHEN** a user reads the Fire-and-Forget recipe
- **THEN** the page explains why `await chats.idle()` is needed and what happens if it is omitted

### Requirement: API Reference section — 14 pages

Fourteen API reference pages SHALL exist under `site/api/`, one per major export or export group.
Each page SHALL include: class/function name and description, all exported TypeScript type
signatures with generic parameters, and a method/property table with types and descriptions.
Each method SHALL link to the corresponding Guide or High-Level page for prose context.

The fourteen pages SHALL cover: `prepareBot`, `prepareComposer`, `prepareMiddleware`, `Chats`,
`User`, `Group`, `Supergroup`, `Channel`, `PrivateChat`, `BusinessAccount`, `OutgoingRequests`,
`Reply`, `Logs` (all five log classes), and `Types` (all exported type aliases and interfaces).

#### Scenario: prepareBot reference shows all options

- **WHEN** a user reads the prepareBot API reference
- **THEN** the `PrepareOptions` type is fully documented including `responses`, `botInfo`, and `onCapture`

#### Scenario: Types page documents all exported interfaces

- **WHEN** a user reads the Types reference
- **THEN** every type exported from the main entry point is listed with its full definition

### Requirement: Reference — Changelog page

`site/reference/changelog.md` SHALL surface the content of `docs/CHANGELOG.md`. Preferred
implementation: symlink at `site/reference/changelog.md → ../../docs/CHANGELOG.md`. If VitePress
does not resolve the symlink during build, the page SHALL instead contain a brief message and
link to the GitHub releases page.

#### Scenario: Changelog content is visible

- **WHEN** a user visits `/reference/changelog`
- **THEN** they see the version history from `docs/CHANGELOG.md` or a direct link to GitHub releases
