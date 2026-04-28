# membership-roles Specification

## Purpose
TBD - created by archiving change add-high-level-chats-api. Update Purpose after archive.
## Requirements
### Requirement: `Membership` represents a per-chat role view

The system SHALL provide a `Membership` type returned from `group.promote(user, perms?)`, `group.restrict(user, perms?)`, and `user.in(group)`. A `Membership` SHALL carry: `user` (the participant), `chat` (the group/supergroup/channel), `status` (`'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked'`), `permissions` (the role's specific permission flags or restrictions), and `untilDate` (optional, for time-bounded restrictions).

#### Scenario: Membership reflects current state

- **WHEN** a user is promoted in a group
- **THEN** `user.in(group).status` equals `'administrator'`
- **AND** `user.in(group).user.id` equals the user's id
- **AND** `user.in(group).chat.id` equals the group's id

### Requirement: `group.promote` grants per-chat admin role

The system SHALL provide `group.promote(user, perms?)` that records the user's status as `'administrator'` in this chat with the supplied (or default-permissive) administrator rights. The change SHALL be reflected in subsequent `user.in(group)` reads. `perms` SHALL accept a partial `ChatAdministratorRights` shape; missing fields SHALL default to `true` (full rights) for backward compatibility with `chats.newAdmin()` callers that don't specify permissions.

#### Scenario: Promote updates the membership map

- **WHEN** the test calls `group.promote(user, { can_delete_messages: true, can_restrict_members: true })`
- **THEN** `user.in(group).status` equals `'administrator'`
- **AND** `user.in(group).permissions.can_delete_messages` is `true`

#### Scenario: Default permissions are permissive

- **WHEN** the test calls `group.promote(user)` (no perms)
- **THEN** `user.in(group).status` equals `'administrator'`
- **AND** `user.in(group).permissions.can_change_info` is `true`
- **AND** `user.in(group).permissions.can_delete_messages` is `true`

### Requirement: `group.restrict` records a restricted status

The system SHALL provide `group.restrict(user, perms?, untilDate?)` that records the user's status as `'restricted'` with the supplied permission overrides and optional until-date. Subsequent `user.in(group)` reads SHALL reflect the restriction.

#### Scenario: Restrict applies and is observable

- **WHEN** the test calls `group.restrict(user, { can_send_messages: false })`
- **THEN** `user.in(group).status` equals `'restricted'`
- **AND** `user.in(group).permissions.can_send_messages` is `false`

#### Scenario: untilDate is preserved

- **WHEN** the test calls `group.restrict(user, { can_send_messages: false }, 1_700_000_000)`
- **THEN** `user.in(group).untilDate` equals `1_700_000_000`

### Requirement: `chat.changeMemberStatus` dispatches `my_chat_member`

The system SHALL provide `chat.changeMemberStatus(user, transition)` that:

1. Reads the current membership for `user` in `chat` (or assumes `'left'` if no record).
2. Constructs a `my_chat_member` update with `old_chat_member` reflecting the current/`from` status and `new_chat_member` reflecting `to` + supplied permissions + optional `untilDate`.
3. Dispatches the update via `bot.handleUpdate`.
4. Updates the internal membership map after dispatch so subsequent `user.in(chat)` reads the new state.

`transition` SHALL accept `{ from?, to, permissions?, untilDate? }`. If `from` is omitted, the current map entry is used (defaulting to `'left'`).

#### Scenario: Dispatches my_chat_member with old/new status

- **WHEN** the test calls `await chat.changeMemberStatus(user, { from: 'member', to: 'restricted', permissions: { can_send_messages: false } })`
- **THEN** the bot under test receives a `my_chat_member` update via `bot.handleUpdate`
- **AND** the update's `my_chat_member.old_chat_member.status` equals `'member'`
- **AND** the update's `my_chat_member.new_chat_member.status` equals `'restricted'`

#### Scenario: Membership map updates after dispatch

- **WHEN** the test calls `await chat.changeMemberStatus(user, { to: 'administrator' })`
- **THEN** subsequent `user.in(chat).status` equals `'administrator'`

### Requirement: `user.in(group)` reads the current membership

The system SHALL provide `user.in(group)` returning the current `Membership` for this user in this group, or `undefined` if the user has no record (i.e. has neither been promoted/restricted nor explicitly added).

#### Scenario: Returns undefined for users with no record

- **WHEN** a user is created with `chats.newUser()` and is asked `user.in(someGroup)` without any prior promote/restrict/changeMemberStatus
- **THEN** the return value is `undefined`

### Requirement: `user.joinChat` updates membership state to `'member'` (preserves higher privilege)

When `user.joinChat(group)` is dispatched, the system SHALL update `group.members.get(user.id)` such that:

- If no entry exists, OR the existing status is `'left'` or `'kicked'`: set the entry to `{ user, chat: group, status: 'member', permissions: {} }`.
- If the existing status is `'creator'`, `'administrator'`, `'restricted'`, or `'member'`: leave the entry unchanged. `joinChat` SHALL NOT downgrade a privileged status to plain member.

#### Scenario: Fresh user becomes a member after joinChat

- **WHEN** a freshly minted user (no prior membership) calls `await user.joinChat(group)`
- **THEN** `user.in(group)?.status` equals `'member'`

#### Scenario: Promoted user retains administrator status after joinChat

- **WHEN** a user has been promoted to administrator (`group.promote(user)`)
- **AND** the test calls `await user.joinChat(group)`
- **THEN** `user.in(group)?.status` is still `'administrator'`
- **AND** the dispatched service message is still observed by the bot's join handler

#### Scenario: User who left can re-join cleanly

- **WHEN** a user previously called `await user.leaveChat(group)` (status now `'left'`)
- **AND** then calls `await user.joinChat(group)`
- **THEN** `user.in(group)?.status` equals `'member'`

### Requirement: `user.leaveChat` updates membership state to `'left'`

When `user.leaveChat(group)` is dispatched, the system SHALL update `group.members.get(user.id)` to `{ user, chat: group, status: 'left', permissions: {} }`. The entry SHALL NOT be deleted from the map. `user.in(group)` SHALL continue to return the membership view with the new status, enabling tests to assert on the post-leave state.

#### Scenario: Membership view reflects 'left' after leaveChat

- **WHEN** a user (with any prior status, including 'administrator' or no prior entry) calls `await user.leaveChat(group)`
- **THEN** `user.in(group)?.status` equals `'left'`

#### Scenario: Leaving a chat the user was never in is still permitted

- **WHEN** a freshly minted user calls `await user.leaveChat(group)` (no prior entry)
- **THEN** the service message dispatches without error
- **AND** `user.in(group)?.status` equals `'left'`

