## ADDED Requirements

### Requirement: `sendText` accepts `anonymous` option for GroupAnonymousBot dispatch

`user.sendText(text, options?)` SHALL accept an optional `anonymous?: boolean` field in its options object. When `anonymous: true`, the method SHALL replace `message.from` with the GroupAnonymousBot identity and set `message.sender_chat`. Full behavioral requirements and all scenarios are defined in the `anonymous-admin-dispatch` capability spec.

#### Scenario: SendTextOptions type includes anonymous field

- **WHEN** a test calls `await user.sendText('text', { chat: group, anonymous: true })`
- **THEN** TypeScript compiles without error (the field is part of the type)

### Requirement: `sendCommand` accepts `anonymous` option for GroupAnonymousBot dispatch

`user.sendCommand(command, args?, options?)` SHALL accept an optional `anonymous?: boolean` field in its options object. The flag SHALL be threaded through to `sendText`. Full behavioral requirements and all scenarios are defined in the `anonymous-admin-dispatch` capability spec.

#### Scenario: sendCommand options type includes anonymous field

- **WHEN** a test calls `await user.sendCommand('/cmd', undefined, { chat: group, anonymous: true })`
- **THEN** TypeScript compiles without error (the field is part of the type)
