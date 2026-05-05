## MODIFIED Requirements

### Requirement: v0.1 surface remains accessible on `chats`

`chats.outgoing` (the `OutgoingRequests` collector) and `chats.idle()` (the async settle helper) SHALL remain accessible on the `Chats` object exposed by every entry point. v0.2 adds capabilities; it does NOT remove or rename anything from v0.1.

The `pollStateCounter` used to generate `update_id` values for `chats.dispatchPollState()` SHALL be instance-scoped (i.e., held on the `Chats` instance), not module-level, so that multiple `Chats` instances within the same test process do not share counter state.

#### Scenario: outgoing and idle remain on chats

- **WHEN** the test calls `await prepareBot(bot)` and inspects the returned `chats`
- **THEN** `chats.outgoing` is the `OutgoingRequests` collector
- **AND** `chats.idle` is a function returning `Promise<void>`

#### Scenario: pollState counter does not bleed between Chats instances

- **WHEN** two separate `Chats` instances are created in the same process
- **AND** each calls `chats.dispatchPollState(poll)` once
- **THEN** both dispatches succeed without interference
- **AND** the `update_id` values produced by each instance are independent of the other

## ADDED Requirements

### Requirement: Reply routing Rule 4 scoped to originating chat

When routing a bot reply to per-user inboxes, Rule 4 (route to a user who recently clicked a button) SHALL only match if the click occurred **in the same chat** as the reply being routed. A button click in chat A SHALL NOT cause bot replies in chat B to appear in the clicking user's inbox.

The `clickers` registry SHALL store both the `userId` and `chatId` of each recorded click. The `recordClick` hook SHALL accept a `chatId` parameter. `userReceivesReply` Rule 4 SHALL require both `byUserId === entry.user.id` AND `byChatId === chat.id` to fire.

#### Scenario: Click in chat A does not route replies in chat B

- **WHEN** user Alice clicks a button in chat A
- **AND** the bot subsequently sends a message in chat B (a different chat)
- **THEN** the message in chat B does NOT appear in Alice's `chats.repliesFor(alice)` inbox

#### Scenario: Click in same chat routes the follow-up reply

- **WHEN** user Alice clicks a button in chat A
- **AND** the bot subsequently sends a message in chat A
- **THEN** the message in chat A appears in Alice's `chats.repliesFor(alice)` inbox
