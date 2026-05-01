## ADDED Requirements

### Requirement: All dispatched updates use `IdGenerator.nextUpdateId()` for `update_id`

Every synthetic `Update` constructed by any `User` action (`sendText`, `sendForwarded`, `editMessage`, `joinChat`, `leaveChat`, and all other send verbs) SHALL obtain its `update_id` exclusively from `this.ctx.ids.nextUpdateId()`. Hardcoded numeric constants and expressions derived from other ID counters (e.g., `nextMessageId() + offset`) SHALL NOT be used as `update_id` values.

This ensures that repeated calls to any verb within a single test produce unique, monotonically increasing `update_id` values and that update IDs do not collide with message IDs or other synthetic identifiers.

#### Scenario: Repeated joinChat calls produce distinct update_ids

- **WHEN** the test calls `await user.joinChat(group)` twice in succession
- **THEN** the two dispatched updates have different `update_id` values
- **AND** both `update_id` values are greater than zero

#### Scenario: Repeated leaveChat calls produce distinct update_ids

- **WHEN** the test calls `await user.leaveChat(group)` twice in succession
- **THEN** the two dispatched updates have different `update_id` values

#### Scenario: sendText update_id does not equal the message_id

- **WHEN** the test calls `await user.sendText('hello')`
- **THEN** the dispatched update's `update_id` does not equal the dispatched update's `message.message_id`
