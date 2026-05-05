## ADDED Requirements

### Requirement: `IdGenerator` provides instance-scoped update IDs

`IdGenerator` SHALL expose a `nextUpdateId(): number` method that returns monotonically increasing integers drawn from a dedicated range (`1_000_000+`). This range SHALL be distinct from the message-ID range (starts at 1) to avoid collisions in test assertions.

All update IDs generated during dispatch — including `my_chat_member`, `chat_member`, service messages, channel posts, reaction counts, and business-account updates — SHALL be drawn from the `Chats`-instance's `IdGenerator` rather than from module-level counters.

#### Scenario: nextUpdateId returns unique values

- **WHEN** the test calls `ids.nextUpdateId()` multiple times on the same `IdGenerator` instance
- **THEN** each call returns a value greater than the previous
- **AND** no two calls return the same value

#### Scenario: Update IDs do not bleed between test runs

- **WHEN** two separate `Chats` instances are created in the same process (e.g., two test cases in the same file)
- **AND** each instance dispatches a `my_chat_member` update
- **THEN** both dispatches succeed
- **AND** the `update_id` values are independently monotonic per instance (the second test does not see values offset by the first test's dispatches)

### Requirement: Group, Supergroup, and Channel receive `ids` at construction

`Group`, `Supergroup`, and `Channel` SHALL accept an `ids: IdGenerator` parameter at construction time. `Chats.registerChat()` SHALL pass `this.ids` to each chat it registers. The `ids` instance SHALL be used exclusively for generating update IDs in dispatch calls originating from those chats, eliminating all module-level counters in `group.ts`, `supergroup.ts`, `channel.ts`, and `dispatch.ts`.

#### Scenario: Chats passes its IdGenerator to registered chats

- **WHEN** the test calls `chats.newGroup()`, `chats.newSupergroup()`, or `chats.newChannel()`
- **THEN** the returned chat holds a reference to the same `IdGenerator` as `chats.outgoing` (i.e., the one owned by the `Chats` instance)
- **AND** any subsequent dispatch from that chat uses `ids.nextUpdateId()` for the `update_id`
