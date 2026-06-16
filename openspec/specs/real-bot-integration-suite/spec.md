## ADDED Requirements

### Requirement: Setup agent clones all target repos

A single agent SHALL clone all nine target bot repos into `../_grammy-testing-integration/<repo-name>/` and write a `README.md` listing each repo, its runtime (Node/Deno), and status (cloned / skipped / inaccessible).

#### Scenario: Repo is accessible

- **WHEN** a target GitHub repo URL responds with a valid git remote
- **THEN** the agent clones it to the integration directory and adds a row to README.md

#### Scenario: Repo is inaccessible

- **WHEN** a target GitHub repo URL returns 404 or is private
- **THEN** the agent adds a "skipped — inaccessible" row to README.md and does not halt

### Requirement: Each bot gets a dedicated test agent

One agent per bot SHALL run in parallel after setup. Each agent installs grammy-testing, writes handler-layer unit tests, and runs them to confirm they pass.

#### Scenario: Node bot test setup

- **WHEN** a bot uses Node.js
- **THEN** the agent installs vitest and `grammy-testing` via npm, writes `*.spec.ts` files co-located with handlers, and runs `npx vitest run`

#### Scenario: Deno bot test setup

- **WHEN** a bot uses Deno
- **THEN** the agent runs `npm run build` in the grammy-testing repo to produce `dist/index.js`, adds `"grammy-testing": "../../grammy-testing/dist/index.js"` to the bot's `deno.json` imports (the built ESM bundle has no bare specifiers beyond `grammy`), writes `*.test.ts` files using `Deno.test` + `@std/expect`, and runs `deno test`

#### Scenario: Deno bot grammy version too old

- **WHEN** bumping grammy to `^1.42.0` causes typecheck failures beyond the test files themselves
- **THEN** the agent stops, marks the bot as "too stale" in README.md, and does not write tests

### Requirement: Tests cover only the handler layer

Each test SHALL import composers or middleware directly and test them via `prepareComposer` or `prepareMiddleware`. Tests SHALL NOT connect to real databases, HTTP APIs, or external services.

#### Scenario: Handler has external service dependency

- **WHEN** a composer calls an external service (DB, HTTP client, etc.)
- **THEN** the agent stubs the service at the boundary using `vi.fn()` or a plain stub object, and passes it via the bot's DI mechanism

#### Scenario: Handler is inseparable from external service

- **WHEN** the external service call is inlined with no injection point
- **THEN** the agent documents the bot as "untestable without refactor" in README.md and skips test writing for that handler

### Requirement: Raw handleUpdate usage is recorded as a finding

Whenever a test pattern cannot be expressed through grammy-testing's public actor/verb API and requires `bot.handleUpdate`, the agent SHALL document the gap in `docs/TODO.md`.

#### Scenario: Pattern requires raw handleUpdate

- **WHEN** an agent cannot find a grammy-testing API call that dispatches the needed update type
- **THEN** the agent writes the test using `bot.handleUpdate` as a workaround AND adds a new entry to `docs/TODO.md` following the existing numbered format: problem description, raw workaround code block, proposed ergonomic API block

#### Scenario: Pattern is expressible through grammy-testing API

- **WHEN** grammy-testing provides a matching actor verb or dispatch helper
- **THEN** the agent uses it; no TODO.md entry is written

### Requirement: Deno test runtime is exercised

The integration suite SHALL serve as the first real-world exercise of grammy-testing under `deno test` (CI only runs `deno check` today).

#### Scenario: deno test passes

- **WHEN** tests run under `deno test` with no errors
- **THEN** the agent records "deno test: ✅" in the bot's README row

#### Scenario: deno test fails due to grammy-testing internals

- **WHEN** `deno test` fails with an error originating inside grammy-testing source (not the bot or test file)
- **THEN** the agent records the error as a finding in `docs/TODO.md` under a "Deno runtime compatibility" section
