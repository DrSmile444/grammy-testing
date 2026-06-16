# update-builders Specification

## Purpose

TBD - created by archiving change add-low-level-testing-primitives. Update Purpose after archive.

## Requirements

### Requirement: Update builders are reachable only via `grammy-testing/low-level`

The system SHALL export the update-builder primitives and generic fixtures from the `grammy-testing/low-level` subpath only. The default `grammy-testing` entry SHALL NOT re-export these symbols. Both subpath entries SHALL be declared in `package.json#exports` so resolution works under Node, Bun, and Deno (`npm:` import) without per-runtime configuration.

#### Scenario: Subpath import succeeds

- **WHEN** a test imports `MessagePrivateMockUpdate` from `grammy-testing/low-level`
- **THEN** the import resolves to a class

#### Scenario: Default entry does not expose builders

- **WHEN** a test attempts to import `MessagePrivateMockUpdate` from `grammy-testing`
- **THEN** the import fails to resolve the symbol

### Requirement: `GenericMockUpdate` abstract base provides shared fixtures

The system SHALL provide an abstract `GenericMockUpdate` class that exposes generic fixtures: `genericUpdateId`, `genericSentDate`, `genericUserBot`, `genericUserAtom`, `genericUser2Atom`, `genericUser`, `genericUser2`, `genericPrivateChat`, `genericGroupChat`, `genericSuperGroup`, `genericChannelChat`, `genericOwner`, `genericAdmin`, `genericUserMember`, and `genericMessagePartial`. The class SHALL declare an abstract `minimalUpdate: Partial<Update>` and an abstract `build(...args): Update`-compatible value.

#### Scenario: Generic fixtures are accessible on subclass instances

- **WHEN** a test instantiates a builder that extends `GenericMockUpdate`
- **THEN** the instance exposes `genericUser`, `genericPrivateChat`, `genericSuperGroup`, etc., with stable IDs and shapes

### Requirement: Concrete update-builder classes implement `.build()` and `.buildOverwrite()`

The system SHALL provide six concrete builder classes — `MessagePrivateMockUpdate`, `MessageMockUpdate` (supergroup), `NewMemberMockUpdate`, `LeftMemberMockUpdate`, `MyChatMemberMockUpdate` — each extending `GenericMockUpdate`. Each SHALL expose `.build()` returning the canonical `Update` for that type and `.buildOverwrite(partial)` returning a deep-merged variant.

#### Scenario: Build returns a valid private message update

- **WHEN** a test calls `new MessagePrivateMockUpdate("hello").build()`
- **THEN** the result has `update_id`, `message.text === "hello"`, `message.chat.type === "private"`, and `message.from` set to the generic user

#### Scenario: BuildOverwrite deep-merges fields

- **WHEN** a test calls `new MessagePrivateMockUpdate("/start").buildOverwrite({ message: { entities: [{ offset: 0, length: 6, type: "bot_command" }] } })`
- **THEN** the result has `message.text === "/start"`
- **AND** `message.entities` equals the supplied array
- **AND** all other generic fields (`from`, `chat`, `date`, `message_id`) are preserved

#### Scenario: Supergroup builder uses the supergroup chat fixture

- **WHEN** a test calls `new MessageMockUpdate("hi").build()`
- **THEN** `message.chat.type === "supergroup"`
- **AND** `message.chat.id` matches `genericSuperGroup.id`

#### Scenario: NewMemberMockUpdate emits the join service message

- **WHEN** a test calls `new NewMemberMockUpdate().build()`
- **THEN** `message.new_chat_members` is a non-empty array
- **AND** `message.chat.type` matches a group-or-supergroup type

#### Scenario: LeftMemberMockUpdate emits the leave service message

- **WHEN** a test calls `new LeftMemberMockUpdate().build()`
- **THEN** `message.left_chat_member` is set
- **AND** `message.chat.type` matches a group-or-supergroup type

#### Scenario: MyChatMemberMockUpdate emits a my_chat_member update

- **WHEN** a test calls `new MyChatMemberMockUpdate().build()`
- **THEN** the result has a `my_chat_member` field with `old_chat_member` and `new_chat_member` populated

### Requirement: Deep-merge semantics for `.buildOverwrite()`

`.buildOverwrite(partial)` SHALL deep-merge `partial` into the canonical update such that: nested objects merge recursively, arrays REPLACE (not concatenate), and primitives REPLACE. The implementation SHALL use a deepmerge utility that matches these semantics.

#### Scenario: Arrays replace, objects merge

- **WHEN** a test overrides `message: { entities: [a], from: { username: "x" } }` on top of a canonical update whose `message.entities` is `[old]` and whose `message.from` has additional fields like `id` and `first_name`
- **THEN** the result's `message.entities` equals `[a]` (array replaced)
- **AND** the result's `message.from.username` equals `"x"` and `message.from.id` is preserved (object merged)

### Requirement: Public-type discipline applies to builder outputs

Builder outputs SHALL use Telegram type definitions from grammY (`Update`, `Message`, etc.) directly. Builder source files SHALL NOT reference Node-only types (`Buffer`, `node:fs`, `node:stream`) in their public signatures.

#### Scenario: Builder output is a plain Telegram Update

- **WHEN** a test inspects the result of any `.build()` call
- **THEN** the result is structurally a `Update` from `grammy/types` (or the underlying `@grammyjs/types`)
- **AND** no `Buffer` or Node-stream value appears anywhere in the structure
