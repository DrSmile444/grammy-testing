# chat-id-override Specification

## Purpose

TBD - created by syncing change fill-remaining-api-gaps. Update Purpose after archive.

## Requirements

### Requirement: Chat factories accept a caller-supplied ID via object profile

`chats.newGroup`, `chats.newSupergroup`, and `chats.newChannel` SHALL each accept an optional object profile `{ id?: number; title?: string; }` in addition to the existing `string | undefined` form. When `profile.id` is supplied, the factory SHALL use that value as the chat's `id` rather than advancing the auto-ID counter. Any integer value SHALL be accepted without validation. When `profile.id` is absent the factory SHALL auto-generate an ID as before. When `profile.title` is absent and `profile.id` is supplied, the title SHALL default to the chat type name concatenated with `Math.abs(id)` (e.g. `'Supergroup1234567'`).

#### Scenario: newSupergroup with explicit id registers the chat under that id

- **WHEN** the test calls `const group = chats.newSupergroup({ id: 1_234_567, title: 'Logs' })`
- **THEN** `group.id` equals `1_234_567`
- **AND** `group.title` equals `'Logs'`

#### Scenario: newSupergroup with id but no title defaults title to TypeName+abs(id)

- **WHEN** the test calls `const group = chats.newSupergroup({ id: 1_234_567 })`
- **THEN** `group.title` equals `'Supergroup1234567'`

#### Scenario: newGroup with explicit id works

- **WHEN** the test calls `const group = chats.newGroup({ id: -999, title: 'Training' })`
- **THEN** `group.id` equals `-999`
- **AND** `group.title` equals `'Training'`

#### Scenario: newChannel with explicit id works

- **WHEN** the test calls `const channel = chats.newChannel({ id: -500, title: 'Alerts' })`
- **THEN** `channel.id` equals `-500`
- **AND** `channel.title` equals `'Alerts'`

#### Scenario: string form still works unchanged

- **WHEN** the test calls `const group = chats.newSupergroup('My Group')`
- **THEN** `group.title` equals `'My Group'`
- **AND** `group.id` is a non-zero auto-generated integer

#### Scenario: no-arg form still works unchanged

- **WHEN** the test calls `const group = chats.newSupergroup()`
- **THEN** `group.id` is a non-zero auto-generated integer
- **AND** `group.title` matches the pattern `'Supergroup<n>'`

#### Scenario: auto-derivation works for a specific-ID supergroup

- **WHEN** the test calls `chats.newSupergroup({ id: 1_234_567, title: 'Logs' })` and dispatches an update in that chat
- **THEN** `getChatAdministrators` auto-derivation returns results based on the registered membership
- **AND** `getChat` auto-derivation returns the registered chat shape
