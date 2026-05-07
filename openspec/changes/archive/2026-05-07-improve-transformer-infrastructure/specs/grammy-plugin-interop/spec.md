## ADDED Requirements

### Requirement: `@grammyjs/auto-retry` retry-on-429 behavior is testable via `respondNextRaw`

The system SHALL support testing `@grammyjs/auto-retry`'s retry loop. When `autoRetry` is installed via `bot.api.config.use()` before `prepareBot` and the test injects a raw rate-limit response using `chats.outgoing.respondNextRaw`, autoRetry SHALL observe the not-ok response, wait the specified `retry_after` duration, and retry the call. The retried call SHALL resolve with the normal synthetic response. This behavior SHALL be verified in `tests/plugins/auto-retry.spec.ts`.

The `retry_after` value used in tests SHALL be `0` or a minimal value (e.g. `0.1`) to avoid wall-clock delays in CI.

#### Scenario: autoRetry retries a sendMessage call after a 429 raw response

- **WHEN** autoRetry is installed before `prepareBot` with `maxRetryAttempts: 1`
- **AND** the test calls `chats.outgoing.respondNextRaw('sendMessage', { ok: false, error_code: 429, description: 'Too Many Requests: retry after 0', parameters: { retry_after: 0 } })`
- **AND** the bot makes a `sendMessage` call
- **THEN** autoRetry retries the call once
- **AND** the second `sendMessage` attempt resolves with the normal synthetic response
- **AND** `chats.outgoing.requests` contains two entries for `sendMessage` (original + retry)

#### Scenario: autoRetry does not retry a GrammyError thrown by failNext

- **WHEN** autoRetry is installed before `prepareBot`
- **AND** the test calls `chats.outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden: bot was blocked by the user' })`
- **AND** the bot makes a `sendMessage` call
- **THEN** autoRetry does not retry (GrammyError throws propagate directly)
- **AND** the error reaches the handler catch block with `error_code === 403`
