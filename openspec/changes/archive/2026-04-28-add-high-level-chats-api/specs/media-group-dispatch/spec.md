## ADDED Requirements

### Requirement: `user.sendMediaGroup` dispatches N updates with shared media_group_id

The system SHALL provide `user.sendMediaGroup(items)` that accepts an array of media-group items (each item shape: `{ type?, caption?, media_group_id?, photo?, video?, document?, ... }`), generates a single `media_group_id` (or uses the first item's if all items already share one), and dispatches `items.length` separate `bot.handleUpdate` calls in sequence. Each dispatched update SHALL carry a message with the same `media_group_id` and the per-item caption/payload from the input array.

The call SHALL resolve only after every individual `handleUpdate` has settled. Item ordering SHALL be preserved.

#### Scenario: Three items dispatch as three updates

- **WHEN** the test calls `await user.sendMediaGroup([{ caption: 'first', photo: 'a.jpg' }, { photo: 'b.jpg' }, { photo: 'c.jpg' }])`
- **THEN** `bot.handleUpdate` is called three times in order
- **AND** each invocation's update message has the same `media_group_id`

#### Scenario: Caption typically lands on the first item only

- **WHEN** the test calls `await user.sendMediaGroup([{ caption: 'group caption', photo: 'a.jpg' }, { photo: 'b.jpg' }])`
- **THEN** the first dispatched update's `message.caption` equals `'group caption'`
- **AND** the second dispatched update's `message.caption` is `undefined`

### Requirement: `media_group_id` is unique across calls

The `media_group_id` generated for each `sendMediaGroup` call SHALL be unique within a `Chats` instance. A subsequent `sendMediaGroup` call SHALL produce a different `media_group_id` so tests can distinguish individual groups.

#### Scenario: Two media groups have distinct ids

- **WHEN** the test calls `sendMediaGroup` twice with disjoint payloads
- **THEN** the `media_group_id` of the first group's items differs from the `media_group_id` of the second group's items

### Requirement: Bot can react per-item or per-group

The dispatched updates SHALL flow through `bot.handleUpdate` exactly as N separate updates, NOT as a single batch. Bots that aggregate by `media_group_id` (e.g. anti-spam swindler-detection-in-captions logic) SHALL see each item individually and accumulate state across them.

#### Scenario: Per-item handler runs N times

- **WHEN** a `bot.on('message:media', ...)` handler is registered
- **AND** `user.sendMediaGroup` dispatches three items
- **THEN** the handler runs three times
- **AND** each invocation's `ctx.message.media_group_id` is the same string
