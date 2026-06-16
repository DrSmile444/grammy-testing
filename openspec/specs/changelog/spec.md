### Requirement: Changelog file exists at docs/CHANGELOG.md

The project SHALL maintain a `docs/CHANGELOG.md` file that records all user-visible changes per released version of `grammy-testing`.

#### Scenario: File exists after change is applied

- **WHEN** the change is applied
- **THEN** `docs/CHANGELOG.md` exists in the repository

### Requirement: Changelog covers complete version history

`docs/CHANGELOG.md` SHALL contain one section for every released version from v0.1.0 through the current version, listed newest-first.

#### Scenario: All released versions are present

- **WHEN** a reader opens `docs/CHANGELOG.md`
- **THEN** they find a section for each of: v0.10.0, v0.9.0, v0.8.0, v0.7.2, v0.7.1, v0.7.0, v0.6.0, v0.5.1, v0.4.0, v0.3.0, v0.2.0, v0.1.1, v0.1.0

#### Scenario: v0.5.0 is omitted

- **WHEN** a reader scans the version headers
- **THEN** there is no `0.5.0` section (that version was never released)

### Requirement: Each version section follows the standard structure

Each version entry SHALL use the format `## X.Y.Z — YYYY-MM-DD` as its heading, contain at least one named subsection (`### <feature group name>`), and list individual changes as bullet points under each subsection.

#### Scenario: Version heading includes date

- **WHEN** a reader looks at any version heading
- **THEN** the heading reads `## X.Y.Z — YYYY-MM-DD` with the correct release date

#### Scenario: Changes are grouped by feature

- **WHEN** a version includes multiple unrelated changes
- **THEN** each group of related changes appears under its own `### <name>` subsection

### Requirement: Changelog is updated with each new release

When a new version of `grammy-testing` is released, `docs/CHANGELOG.md` SHALL be updated to include a new section at the top for that version before the release is tagged.

#### Scenario: New version section added before release

- **WHEN** a maintainer is preparing a new release
- **THEN** they add a new `## X.Y.Z — YYYY-MM-DD` section above the previous latest entry before bumping the version

### Requirement: OpenSpec tasks rule enforces changelog update reminder

`openspec/config.yaml` SHALL contain a `rules.tasks` entry that instructs every auto-generated `tasks.md` to include a "Update `docs/CHANGELOG.md`" task.

#### Scenario: Generated tasks.md includes changelog step

- **WHEN** a new OpenSpec change is created and its `tasks.md` is generated
- **THEN** the task list includes an item for updating `docs/CHANGELOG.md`
