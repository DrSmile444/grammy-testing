## ADDED Requirements

### Requirement: `_previous` in `createTransformer` is documented as intentionally unused

The `createTransformer` function in `src/low-level/transformer.ts` SHALL have an inline comment on its `_previous` parameter explaining that it is intentionally never called. The comment SHALL reference the consequence: calling it would break the snapshot-and-reinstall assumption in `prepareBot` by routing requests to the real Telegram API through the inner copy of user-installed transformers.

#### Scenario: Code reviewer can understand the invariant without reading prepareBot

- **WHEN** a developer reads `createTransformer` in isolation
- **THEN** the comment on `_previous` makes it clear that calling it is intentionally avoided, not an oversight
- **AND** the developer understands that this is a load-bearing constraint for the transformer chain ordering

#### Scenario: Attempted call to `_previous` is visibly wrong

- **WHEN** a developer adds a code path that calls `_previous(method, payload, signal)`
- **THEN** the existing comment makes the invariant violation immediately apparent in code review
- **AND** no silent regression occurs without a reviewer noticing the change
