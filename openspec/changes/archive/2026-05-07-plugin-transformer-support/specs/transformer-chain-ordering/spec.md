## ADDED Requirements

### Requirement: Library transformer is innermost in the chain

The system SHALL position its mock transformer at the innermost position (index 0) of the `bot.api.config.installedTransformers()` array. The library SHALL use the snapshot-and-reinstall approach: snapshot existing transformers before installing its own, then reinstall user transformers on top via `bot.api.config.use(...existing)`.

#### Scenario: Bot-level transformer installed before prepareBot runs

- **WHEN** a bot installs a transformer via `bot.api.config.use(myTransformer)` before calling `prepareBot`
- **AND** `prepareBot` is called
- **THEN** the library transformer is at index 0 in `installedTransformers`
- **AND** `myTransformer` is at a higher index (outermost position)

#### Scenario: Bot-level transformer installed after prepareBot runs

- **WHEN** `prepareBot` is called first
- **AND** a transformer is then installed via `bot.api.config.use(myTransformer)`
- **THEN** `myTransformer` is appended as outermost (correct default behaviour)
- **AND** calling `_previous` inside `myTransformer` chains through to the library transformer

### Requirement: All bot-level transformers execute during tests

The system SHALL ensure that all transformers installed on `bot.api.config` before `prepareBot` are invoked for every API call made during a test. Transformers SHALL receive the synthetic response produced by the library transformer and be able to mutate or augment it.

#### Scenario: Payload-modifying transformer applies during test

- **WHEN** a transformer that adds a field to the outgoing payload is installed before `prepareBot`
- **AND** the bot sends a message during a test
- **THEN** the captured outgoing payload MUST include the field added by the transformer

#### Scenario: Response-augmenting transformer applies during test

- **WHEN** a transformer that adds methods to the API response is installed before `prepareBot`
- **AND** the bot calls an API method during a test
- **THEN** the response object MUST have the methods added by the transformer

### Requirement: Context-level transformers continue to work

The system SHALL not break context-level transformers installed via `ctx.api.config.use()` inside middleware. These transformers run per-request above the per-update chain and SHALL continue to call through to the library transformer and receive synthetic responses.

#### Scenario: ctx.api.config.use transformer receives synthetic response

- **WHEN** a middleware installs a transformer via `ctx.api.config.use(ctxTransformer)`
- **AND** the bot makes an API call in that middleware
- **THEN** `ctxTransformer` runs
- **AND** `ctxTransformer` receives the synthetic response from the library transformer
