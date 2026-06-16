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

---

### Requirement: Why section

The README SHALL include a "Why" section explaining the problem (`grammY ships no testing
tools, existing solutions are unmaintained or Deno-only`) and the solution (in-process bot
driving, no token, no network). It SHALL open with a bold hook sentence.

#### Scenario: Problem is stated clearly

- **WHEN** a developer reads the Why section
- **THEN** they understand why no good alternative existed before this library

#### Scenario: Solution is stated clearly

- **WHEN** a developer reads the Why section
- **THEN** they understand that the library runs the real bot in-process with synthetic updates

---

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

---

### Requirement: Features section (high-level only)

The README SHALL include a "Features" section listing capabilities as bullet groups,
covering: actors & chat types, dispatch verbs, reply & request assertions, session & state
injection, isolation utilities, and ecosystem notes (Vitest + Jest, TypeScript-first).
Low-level API SHALL be mentioned in one brief line only.

#### Scenario: High-level API is the focus

- **WHEN** a developer reads the Features section
- **THEN** `User`, `Group`, `Supergroup`, `Channel`, and related actors are prominently listed

#### Scenario: Low-level API is acknowledged

- **WHEN** a developer reads the Features section
- **THEN** they see a single mention that a low-level API exists for advanced scenarios

---

### Requirement: Examples table with all 20 entries

The README SHALL include an "Examples" section with a markdown table listing all 20
examples from the `examples/` directory. Each row SHALL contain the example number,
a linked name pointing to the correct `./examples/<folder>/` path, and a brief description.

#### Scenario: All 20 examples are listed

- **WHEN** a developer reads the Examples section
- **THEN** they see entries for examples 01 through 20

#### Scenario: Example links resolve on GitHub

- **WHEN** a developer clicks an example link
- **THEN** they are taken to the correct `examples/<folder>/` subdirectory

---

### Requirement: Documentation section with VitePress placeholder

The README SHALL include a "Documentation" section that acknowledges full API reference
and guides are being built with VitePress, and directs users to the `examples/` directory
in the meantime.

#### Scenario: Placeholder is visible in rendered markdown

- **WHEN** a developer reads the README on GitHub or npm
- **THEN** they see a rendered note (not an HTML comment) about upcoming VitePress docs

#### Scenario: Examples link is always useful

- **WHEN** VitePress docs do not yet exist
- **THEN** the section still provides value by linking to the examples directory

---

### Requirement: Credits section

The README SHALL include a "Credits" section before the License section acknowledging:

- `grammy_tests` by dcdunkan (URL: `https://github.com/dcdunkan/grammy_tests`) — inspired
  the original testing concept
- `ua-anti-spam-bot` by MoC-OSS (URL: `https://github.com/MoC-OSS/ua-anti-spam-bot`) —
  real-world test patterns that shaped the high-level API

#### Scenario: Both projects are credited

- **WHEN** a developer reads the Credits section
- **THEN** they see named links to both `grammy_tests` and `ua-anti-spam-bot`

---

### Requirement: License section

The README SHALL end with a "License" section stating MIT and linking to `LICENSE`.

#### Scenario: License is stated

- **WHEN** a developer reads the bottom of the README
- **THEN** they see "MIT" and a link to the LICENSE file
