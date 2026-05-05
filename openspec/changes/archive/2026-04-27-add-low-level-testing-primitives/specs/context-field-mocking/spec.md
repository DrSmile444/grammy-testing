## ADDED Requirements

### Requirement: `mockContextField` produces a typed mocked value plus middleware

The system SHALL expose a generic `mockContextField<TContext, TField, TResult>(fieldName, remap)` that returns a factory function. The factory SHALL accept a `PartialDeep<TContext[TField]>` value and return the result of `remap({ mocked, middleware })`. The produced `middleware` SHALL be a grammY middleware function that assigns `mocked` to `context[fieldName]` and then calls `next()`.

#### Scenario: Generic mock injects field via middleware

- **WHEN** the test creates a mock for an arbitrary context field via `mockContextField` with `fieldName === "myField"`
- **AND** registers the resulting middleware on the bot
- **AND** dispatches an update
- **THEN** the handler observes `ctx.myField` equal to the mocked value

#### Scenario: Mocked value is mutable between assertions

- **WHEN** the test obtains the mocked value via the factory
- **AND** mutates a property on it between two `bot.handleUpdate` calls
- **THEN** the second call's middleware observes the updated value

### Requirement: `mockSession` specialization

The system SHALL expose `mockSession(partial)` returning `{ session, mockSessionMiddleware }`, where `session` is the (mutable) mocked value and `mockSessionMiddleware` is a grammY middleware that injects it onto `ctx.session`.

#### Scenario: mockSession injects partial session

- **WHEN** the test calls `const { session, mockSessionMiddleware } = mockSession({ language: "en" })`
- **AND** registers `mockSessionMiddleware` on the bot
- **AND** dispatches an update
- **THEN** the handler observes `ctx.session.language === "en"`

#### Scenario: Mutating session between calls

- **WHEN** the handler observes the initial session value
- **AND** the test sets `session.language = "uk"` between dispatches
- **THEN** the next handler invocation observes `ctx.session.language === "uk"`

### Requirement: `mockChatSession` specialization

The system SHALL expose `mockChatSession(partial)` returning `{ chatSession, mockChatSessionMiddleware }` mirroring the `mockSession` API but bound to `ctx.chatSession`.

#### Scenario: mockChatSession injects partial chat session

- **WHEN** the test calls `mockChatSession({ isBotAdmin: true })`
- **AND** registers the resulting middleware
- **AND** dispatches an update
- **THEN** the handler observes `ctx.chatSession.isBotAdmin === true`

### Requirement: `mockState` specialization

The system SHALL expose `mockState(partial)` returning `{ state, mockStateMiddleware }` mirroring the `mockSession` API but bound to `ctx.state`.

#### Scenario: mockState injects partial state

- **WHEN** the test calls `mockState({ foo: 1 })`
- **AND** registers the resulting middleware
- **AND** dispatches an update
- **THEN** the handler observes `ctx.state.foo === 1`
