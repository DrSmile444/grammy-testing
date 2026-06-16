# reference-suite Specification

## Purpose

The reference suite is the v1.0 acceptance suite for `grammy-testing`. It lives at `tests/reference/` and contains one spec file per pattern category. The suite proves that the library supports real-world testing patterns at the highest available API surface. v1.0 cuts only when every test in this suite passes.

## Requirements

### Requirement: Reference suite exists under `tests/reference/`

The system SHALL maintain a reference test suite at `tests/reference/` containing one spec file per pattern category. The suite SHALL be runnable by the project's standard test command (`npm run test:run`) and SHALL pass green at all times on the default branch.

#### Scenario: Reference suite directory exists and runs

- **WHEN** a contributor checks out the default branch and runs `npm run test:run`
- **THEN** at least one test file matching `tests/reference/**/*.spec.ts` is loaded
- **AND** every reference-suite test passes

#### Scenario: Each audited pattern category has a dedicated file

- **WHEN** a contributor lists `tests/reference/`
- **THEN** there is at least one spec file per pattern category — at minimum: `business-api`, `channel-posts`, `commands`, `context-constructor`, `error-simulation`, `media-groups`, `media-single`, `membership`, `menu-flows`, `messages`, `modern-update-types`, `private-chat-messages`, `remaining-dispatch-verbs`, `reply-accessors`, `service-messages`, `sessions`, `special-message-verbs`.

### Requirement: Every audited pattern is exercised by a passing test

The reference suite SHALL include at least one passing test for each pattern in the `docs/project.md` §"Reference test suite" audit list. Adding a new pattern to that audit SHALL be accompanied by a reference-suite test that demonstrates the pattern using the highest-level v0.2 API surface available.

#### Scenario: Audit list maps to test coverage

- **WHEN** a reviewer cross-references the bullet list in `docs/project.md` §"Reference test suite" against `tests/reference/`
- **THEN** every bullet has at least one passing test that exercises it

#### Scenario: Pattern uses highest-available API surface

- **WHEN** a pattern can be expressed via a v0.2 high-level verb (e.g. `user.sendCommand`, `chat.changeMemberStatus`, `chats.outgoing.failNext`)
- **THEN** the reference test for that pattern uses the high-level verb
- **AND** does not reach for `buildOverwrite()` or low-level `MockUpdate` builders

### Requirement: Each spec file ships with a documentation header

Every file under `tests/reference/` SHALL start with a JSDoc-style header that identifies (a) the pattern category name, (b) what the pattern exercises, (c) which v0.2 API verbs are used, and (d) any current escape-hatch usage tagged as a `v0.2.x gap`.

#### Scenario: Header format is grep-friendly

- **WHEN** a contributor runs `grep -rn "v0.2.x gap" tests/reference/`
- **THEN** every escape-hatch usage in the suite is reported

#### Scenario: Header content is informative

- **WHEN** a contributor opens any single reference-suite file
- **THEN** the header explains what the pattern is and how the v0.2 API expresses it
- **AND** notes any `buildOverwrite()` or low-level `MockUpdate` fallback the file relies on

### Requirement: Escape-hatch usages are cataloged in the README

`tests/reference/README.md` SHALL contain a markdown table listing every pattern that currently uses an escape hatch (`buildOverwrite()`, low-level `MockUpdate` constructors, or inline `Update` literals). Each row SHALL identify the pattern, the current expression, and the suggested v0.2.x verb proposal name (suggestive, not binding) that would close the gap.

#### Scenario: README catalog matches tagged escape-hatch usages

- **WHEN** a contributor cross-references `grep -rn "v0.2.x gap" tests/reference/` against the README's gap table
- **THEN** every tagged code-level gap appears as a row in the table
- **AND** every row in the table corresponds to at least one tagged code-level gap

#### Scenario: Closing a gap updates the README

- **WHEN** a v0.2.x verb proposal lands that supplants an escape-hatch usage
- **THEN** the proposal's tasks include removing the corresponding tag from the reference test
- **AND** removing the corresponding row from the README table

### Requirement: Reference suite uses generic, domain-neutral examples

Reference-suite tests SHALL use generic bot examples (`/start` welcome bot, echo bot, simple menu bot, language-picker bot, etc.) and SHALL NOT embed application-specific terminology, assertions, or business logic.

#### Scenario: No domain-specific terminology

- **WHEN** a reviewer searches reference-suite files for terms like `swindler`, `denylist`, `nsfw`, `russian`, `antisemitism`, `tensor`
- **THEN** no match is found

#### Scenario: Tests describe testing patterns, not anti-spam features

- **WHEN** a reviewer reads any test name in the reference suite
- **THEN** the name describes a testing pattern (e.g. "deletes a forwarded message", "applies cooldown after warning") rather than a specific business feature
