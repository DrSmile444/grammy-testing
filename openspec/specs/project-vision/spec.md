# project-vision Specification

## Purpose

TBD - created by archiving change update-project-vision. Update Purpose after archive.

## Requirements

### Requirement: Project doc records the v0.1 / v0.2 / v0.3 phase plan

`docs/project.md` SHALL contain a dedicated section that names the three pre-1.0 phases, the scope of each, and the OpenSpec change that delivers each phase.

#### Scenario: Phase plan section exists

- **WHEN** a reader scans the doc's table of contents
- **THEN** there is a section titled "Phase plan" (or similar) that names v0.1, v0.2, and v0.3 distinctly

#### Scenario: Each phase has scoped contents

- **WHEN** a reader reads the phase plan section
- **THEN** v0.1 lists low-level primitives (entry points, OutgoingRequests, mocks, builders) and references the archived `add-low-level-testing-primitives` change
- **AND** v0.2 lists the high-level Chats/User/Admin layer and references its proposed change name (`add-high-level-chats-api`)
- **AND** v0.3 lists plugin interop, multi-runtime publish, VitePress site, and references its proposed change names

### Requirement: Project doc records the locked-in API-shape decisions

`docs/project.md` SHALL document the API-shape decisions that emerged from the v0.1 design exploration so future readers and proposals see them as decided, not open. The decisions covered are: three explicit entry points (not one polymorphic), transformer-promise async tracking with documented setTimeout non-coverage, web-platform public types (`Uint8Array` / `ReadableStream`), layered subpath exports, error-simulation sugar spec, canned responses as static-or-function, `Admin` as a per-chat role not an identity class, three-layered reply ownership, eager/tee/URL-string file capture, and conversations-blind plugin design.

#### Scenario: Doc names the three-entry-points decision

- **WHEN** a reader looks for "what entry points does the plugin expose"
- **THEN** the doc names `prepareBot`, `prepareComposer`, `prepareMiddleware` as three distinct exports
- **AND** notes the rationale (per-entry type narrowing, clearer call sites)

#### Scenario: Doc names the async-tracking strategy

- **WHEN** a reader looks for "how does idle() work"
- **THEN** the doc describes Strategy 2 (transformer-wrapped promises tracked in a set) and explicitly disclaims tracking of `setTimeout`-scheduled work

#### Scenario: Doc names the layered exports decision

- **WHEN** a reader looks at the package's import surface
- **THEN** the doc shows that `grammy-testing` is the curated default and `grammy-testing/low-level` is the escape hatch containing update-builder primitives

#### Scenario: Doc names Admin as role, not identity

- **WHEN** a reader looks at the high-level API description
- **THEN** the doc describes `chats.newUser()` returning a `User` and `group.promote(user, perms?)` granting per-chat admin role
- **AND** clarifies that `chats.newAdmin()` is sugar (newUser + promote in default chat), not a distinct identity class

#### Scenario: Doc names the conversations interop approach

- **WHEN** a reader looks for "how does this work with @grammyjs/conversations"
- **THEN** the doc states that the plugin stays conversations-blind and that interop ships as a recipe page using `MemorySession`

### Requirement: Project doc designates an updated validation gate for v1.0

`docs/project.md` SHALL describe the v1.0 release criteria in terms of the in-repo reference suite. The criteria SHALL include: every reference-suite pattern passes, at least one external user has tried the plugin, and the grammY team has reviewed it.

#### Scenario: Versioning section names reference suite

- **WHEN** a reader reads §"Versioning & release plan"
- **THEN** the v1.0 cut criteria reference the in-repo reference suite as the parity proof

### Requirement: Strategic doc edits are tracked through OpenSpec changes

Substantive edits to `docs/project.md` that change the strategic claims listed above SHALL go through a dedicated OpenSpec change proposal that updates this `project-vision` spec. Trivial edits (typo fixes, prose clarifications that don't alter strategic claims, adding examples that don't change scope) do NOT require a `project-vision`-touching change.

#### Scenario: A new strategic decision triggers a project-vision update

- **WHEN** a future change introduces a new strategic shift (e.g., conversations interop becomes core, a fourth phase is added)
- **THEN** that change includes a delta to `openspec/specs/project-vision/spec.md` reflecting the shift
- **AND** edits `docs/project.md` in the same change

#### Scenario: A typo fix does NOT require a project-vision update

- **WHEN** a contributor fixes a typo in `docs/project.md` that does not change any strategic claim
- **THEN** they MAY commit the fix without an OpenSpec change proposal
