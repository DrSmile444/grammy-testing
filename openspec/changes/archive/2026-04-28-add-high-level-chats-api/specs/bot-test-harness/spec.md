## ADDED Requirements

### Requirement: `chats` exposes the v0.2 orchestrator surface

In addition to the v0.1 `outgoing` and `idle` members, the `chats` value returned by every entry point (`prepareBot`, `prepareComposer`, `prepareMiddleware`) SHALL expose the v0.2 orchestrator surface — `newUser`, `newAdmin`, `newPrivateChat`, `newGroup`, `newSupergroup`, `newChannel` (per the `chats-orchestrator` capability) — as well as iteration accessors for participants and chats minted on this instance.

This requirement extends the v0.1 "All three entry points return the same shape" requirement; the existing v0.1 requirements (capture, idle, canned responses, entry-point parity) remain unchanged.

#### Scenario: Entry-point chats has v0.2 surface

- **WHEN** the test calls `await prepareBot(bot)` and inspects `chats`
- **THEN** `chats.newUser` is a function
- **AND** `chats.newAdmin` is a function
- **AND** `chats.newPrivateChat` is a function
- **AND** `chats.newGroup` is a function
- **AND** `chats.newSupergroup` is a function
- **AND** `chats.newChannel` is a function

#### Scenario: All three entry points yield the v0.2 surface uniformly

- **WHEN** the test calls each of `prepareBot`, `prepareComposer`, `prepareMiddleware` and inspects each returned `chats`
- **THEN** each `chats` exposes the same v0.2 orchestrator surface
- **AND** code that calls `chats.newUser()` works identically regardless of entry point
