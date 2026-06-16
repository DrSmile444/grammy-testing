## MODIFIED Requirements

### Requirement: README header with logo, title, and badges

The README SHALL open with a full-width banner (`./docs/grammy-testing-logo.svg` at
`width="1080"`) followed by the tagline `# Production-grade testing infrastructure for
grammY bots.` as a right-aligned `#` heading (matching grammY's "The Telegram Bot
Framework" pattern), then two badges (npm version, MIT license). The JSR badge SHALL be
omitted during the third-party phase. All badges SHALL use `style=flat`, `labelColor=000`,
and `color=ffd700`.

#### Scenario: Logo renders on GitHub

- **WHEN** the README is viewed on GitHub
- **THEN** the `./docs/grammy-testing-logo.svg` banner renders at full width at the top

#### Scenario: Badges link to correct registries

- **WHEN** a user clicks the npm badge
- **THEN** they are taken to `https://www.npmjs.com/package/grammy-testing`

#### Scenario: No JSR badge is shown

- **WHEN** the README header is rendered
- **THEN** no JSR badge is present

#### Scenario: Badges use yellow brand color

- **WHEN** badges are rendered
- **THEN** the value section uses `#ffd700` background with auto-applied black text

### Requirement: Quick Start section

The README SHALL include a "Quick Start" section with:

1. An installation command for npm
2. A minimal two-part code snippet: the `/start` command handler and its test using
   `prepareBot`, `chats.newUser()`, `user.sendCommand('/start')`, and
   `user.replies.lastOrThrow().text`

The JSR install command SHALL be omitted during the third-party phase.

#### Scenario: npm install command is correct

- **WHEN** a developer copies the install command
- **THEN** `npm install --save-dev grammy-testing` installs the package

#### Scenario: No JSR install command is shown

- **WHEN** a developer reads the Quick Start section
- **THEN** no `npx jsr add` command is present

#### Scenario: Code example compiles and runs

- **WHEN** a developer copies the Quick Start test snippet
- **THEN** it is valid TypeScript that passes with the current library API
