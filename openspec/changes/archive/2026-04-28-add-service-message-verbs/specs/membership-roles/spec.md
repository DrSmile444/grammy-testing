## ADDED Requirements

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
