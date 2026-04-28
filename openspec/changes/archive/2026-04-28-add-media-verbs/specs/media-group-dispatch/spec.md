## MODIFIED Requirements

### Requirement: `user.sendMediaGroup` dispatches N updates with shared media_group_id

The system SHALL provide `user.sendMediaGroup(items)` that accepts an array of media-group items (each item shape: `{ type?, caption?, media_group_id?, photo?, video?, document?, ... }`), generates a single `media_group_id` (or uses the first item's if all items already share one), and dispatches `items.length` separate `bot.handleUpdate` calls in sequence. Each dispatched update SHALL carry a message with the same `media_group_id` and the per-item caption/payload from the input array.

When an item's `photo` field is a non-empty string, `message.photo` SHALL be a one-element `PhotoSize[]` stub with `file_id` equal to that string; `message.photo` SHALL be `undefined` when `photo` is absent. The same pattern applies to `document` (produces `message.document` stub) and `video` (produces `message.video` stub).

The call SHALL resolve only after every individual `handleUpdate` has settled. Item ordering SHALL be preserved.

#### Scenario: Three items dispatch as three updates

- **WHEN** the test calls `await user.sendMediaGroup([{ caption: 'first', photo: 'a.jpg' }, { photo: 'b.jpg' }, { photo: 'c.jpg' }])`
- **THEN** `bot.handleUpdate` is called three times in order
- **AND** each invocation's update message has the same `media_group_id`

#### Scenario: Caption typically lands on the first item only

- **WHEN** the test calls `await user.sendMediaGroup([{ caption: 'group caption', photo: 'a.jpg' }, { photo: 'b.jpg' }])`
- **THEN** the first dispatched update's `message.caption` equals `'group caption'`
- **AND** the second dispatched update's `message.caption` is `undefined`

#### Scenario: photo string produces a populated PhotoSize stub

- **WHEN** the test calls `await user.sendMediaGroup([{ photo: 'a.jpg' }, { photo: 'b.jpg' }])`
- **AND** the bot reads `ctx.message.photo?.[0]?.file_id` in a handler
- **THEN** the first update yields `file_id === 'a.jpg'`
- **AND** the second update yields `file_id === 'b.jpg'`
