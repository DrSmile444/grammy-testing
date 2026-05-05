## ADDED Requirements

### Requirement: `group.own` and `supergroup.own` set creator status without dispatch

The system SHALL provide `group.own(user)` on both `Group` and `Supergroup` that records the user's status as `'creator'` in the members map with `permissions: { is_anonymous: false }`. No Telegram update SHALL be dispatched. The change SHALL be reflected in subsequent `user.in(group)` reads and in auto-derived `getChatMember` responses.

#### Scenario: own() sets creator status

- **WHEN** the test calls `group.own(user)`
- **THEN** `user.in(group).status` equals `'creator'`
- **AND** no `my_chat_member` update is dispatched to the bot

#### Scenario: own() returns the Membership record

- **WHEN** the test calls `const m = group.own(user)`
- **THEN** `m.status` equals `'creator'`
- **AND** `m.user` is the same user actor
- **AND** `m.chat` is the same group

#### Scenario: own() overwrites a prior status

- **WHEN** a user has previously been promoted to `'administrator'` via `group.promote(user)`
- **AND** the test then calls `group.own(user)`
- **THEN** `user.in(group).status` equals `'creator'`

### Requirement: `group.join` and `supergroup.join` set member status without dispatch

The system SHALL provide `group.join(user)` on both `Group` and `Supergroup` that records the user's status as `'member'` in the members map with `permissions: {}`. No Telegram update SHALL be dispatched. The change SHALL be reflected in subsequent `user.in(group)` reads and in auto-derived `getChatMember` responses.

#### Scenario: join() sets member status

- **WHEN** the test calls `group.join(user)`
- **THEN** `user.in(group).status` equals `'member'`
- **AND** no `my_chat_member` update is dispatched to the bot

#### Scenario: join() returns the Membership record

- **WHEN** the test calls `const m = group.join(user)`
- **THEN** `m.status` equals `'member'`
- **AND** `m.user` is the same user actor

### Requirement: `chats.newOwner` creates a user with creator status in the default group

The system SHALL provide `chats.newOwner(profile?)` that creates a new user (delegating to `newUser(profile)`) and calls `defaultGroup.own(user)`. The default supergroup SHALL be lazily created on the first call, exactly as `newAdmin()` does. The method SHALL return the new `User` instance.

#### Scenario: newOwner creates user with creator status

- **WHEN** the test calls `const owner = chats.newOwner()`
- **THEN** `owner` is a registered `User` actor
- **AND** `owner.in(chats.defaultGroup).status` equals `'creator'`

#### Scenario: newOwner accepts a profile override

- **WHEN** the test calls `chats.newOwner({ first_name: 'Alice' })`
- **THEN** the returned user's `first_name` equals `'Alice'`
- **AND** the user's status in the default group equals `'creator'`

#### Scenario: newOwner lazily creates the default group

- **WHEN** no default group exists yet
- **AND** the test calls `chats.newOwner()`
- **THEN** `chats.defaultGroup` is a `Supergroup` instance
- **AND** the new user is the creator of that group
