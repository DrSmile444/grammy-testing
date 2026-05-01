## MODIFIED Requirements

### Requirement: Package installs cleanly in consumer projects

The published `@grammyjs/testing` package SHALL NOT include a `postinstall` script in its `package.json`. Consumer projects running `npm install @grammyjs/testing` SHALL complete without errors and SHALL NOT require `--ignore-scripts`.

#### Scenario: Consumer npm install succeeds without flags

- **WHEN** a consumer project runs `npm install @grammyjs/testing`
- **THEN** the installation completes with exit code 0
- **AND** no error about a missing `link-codex-skills.sh` or any other postinstall script is reported
