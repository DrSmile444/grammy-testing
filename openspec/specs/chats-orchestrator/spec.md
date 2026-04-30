# chats-orchestrator Specification

## Purpose

TBD - created by archiving change add-high-level-chats-api. Update Purpose after archive.

## Requirements

### Requirement: `chats.newUser` mints a participant

The system SHALL provide `chats.newUser(profile?)` that returns a `User<TContext>` instance. The optional `profile` parameter SHALL accept `{ id?, first_name?, last_name?, username?, ... }` partial Telegram `User` fields; missing fields SHALL be filled from sensible defaults derived from the v0.1 `genericUserAtom` fixture, with unique IDs generated per call.

#### Scenario: Mints a user with default profile

- **WHEN** the test calls `const user = chats.newUser()`
- **THEN** the returned value is a `User` instance
- **AND** `user.id` is a number unique to this `chats` instance
- **AND** `user.first_name` is a non-empty string
- **AND** `user.is_bot` is `false`

#### Scenario: Honors profile overrides

- **WHEN** the test calls `chats.newUser({ id: 42, username: 'alice' })`
- **THEN** the returned `user.id` equals `42`
- **AND** `user.username` equals `'alice'`

### Requirement: `chats.newAdmin` is sugar for newUser + promote

The system SHALL provide `chats.newAdmin(profile?, perms?)` that creates a user via `newUser`, mints (if needed) a default supergroup on the `chats` instance, and promotes the user in that group. The returned value SHALL be a `User<TContext>` (NOT a distinct class). `chats.newAdmin()` is a convenience for tests that don't need explicit role-transition control.

#### Scenario: Creates user and promotes in default group

- **WHEN** the test calls `const admin = chats.newAdmin()`
- **THEN** the returned value is a `User` instance
- **AND** `admin.in(chats.defaultGroup).status` equals `'administrator'`

#### Scenario: Honors permission overrides

- **WHEN** the test calls `chats.newAdmin(undefined, { can_delete_messages: true, can_restrict_members: false })`
- **THEN** `admin.in(chats.defaultGroup).permissions.can_delete_messages` is `true`
- **AND** `admin.in(chats.defaultGroup).permissions.can_restrict_members` is `false`

### Requirement: Chat-creating factory methods

The system SHALL provide chat-creating methods on `Chats`:

- `chats.newPrivateChat(user)` returning a `PrivateChat` with `chat.id === user.id`.
- `chats.newGroup(name?)` returning a `Group`.
- `chats.newSupergroup(name?)` returning a `Supergroup`.
- `chats.newChannel(name?)` returning a `Channel`.

Each chat factory SHALL produce a chat with a unique numeric `chat.id` and the appropriate Telegram `chat.type` discriminant (`'private'` | `'group'` | `'supergroup'` | `'channel'`).

#### Scenario: Each factory yields the right chat type

- **WHEN** the test calls each of `newPrivateChat`, `newGroup`, `newSupergroup`, `newChannel`
- **THEN** the returned chats have types `'private'`, `'group'`, `'supergroup'`, `'channel'` respectively
- **AND** each `chat.id` is unique across the `chats` instance

#### Scenario: PrivateChat id matches user id

- **WHEN** the test calls `const dm = chats.newPrivateChat(user)`
- **THEN** `dm.id` equals `user.id`
- **AND** `dm.type` equals `'private'`

### Requirement: v0.1 surface remains accessible on `chats`

`chats.outgoing` (the `OutgoingRequests` collector) and `chats.idle()` (the async settle helper) SHALL remain accessible on the `Chats` object exposed by every entry point. v0.2 adds capabilities; it does NOT remove or rename anything from v0.1.

#### Scenario: outgoing and idle remain on chats

- **WHEN** the test calls `await prepareBot(bot)` and inspects the returned `chats`
- **THEN** `chats.outgoing` is the `OutgoingRequests` collector
- **AND** `chats.idle` is a function returning `Promise<void>`
