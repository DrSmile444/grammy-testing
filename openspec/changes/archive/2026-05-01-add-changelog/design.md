## Context

The project has 14 released versions (v0.1.0–v0.10.0) recorded entirely in git history and archived OpenSpec changes. There is no human-readable changelog file. The reference format comes from `eslint-plugin-lintlord/docs/reference/changelog.md`, which uses version headers, named subsection headings per feature group, and bullet-point details.

The version-to-feature mapping was fully reconstructed from git log version bump commits and the 25 archived OpenSpec change proposals. No ambiguity remains; the content is ready to write.

## Goals / Non-Goals

**Goals:**
- Single `docs/CHANGELOG.md` covering all 14 versions, newest first
- Each version section: `## [vX.Y.Z] — YYYY-MM-DD` heading, one or more named subsections, bullet points per meaningful user-visible change
- Process guard: `openspec/config.yaml` tasks rule that auto-includes a changelog update task in every future change

**Non-Goals:**
- Linking to PRs, commits, or issues (none are public yet)
- Automated changelog generation tooling (keep-a-changelog, semantic-release, etc.)
- Changelog for OpenSpec-internal or docs-only commits (only user-facing changes)

## Decisions

### Format: mirror lintlord, no emoji

The lintlord changelog uses emoji in section headers (`### ✨ New Rule`). The grammy-testing project does not use emoji in any existing documentation (`README.md`, `docs/`). Decision: plain headers only (`### New dispatch verbs`), consistent with the existing doc tone.

**Alternatives considered:** Keeping emoji to make the changelog more visually scannable. Rejected — style inconsistency with the rest of the project docs.

### Version heading includes date

`## 0.10.0 — 2026-05-01` (matching lintlord's style for versions that have a known date). All dates were recovered from git log.

**Alternatives considered:** Omitting dates to avoid staleness. Rejected — dates are committed history, they don't change.

### v0.1.0 uses subsections, not "Initial Release" monolith

v0.1.0 shipped low-level primitives, the full high-level Chats/User/Admin API, build infrastructure, and CI in a single implicit version. Lumping everything under `### Initial Release` loses the structure. Decision: use the same named-subsection pattern as later versions.

### No v0.5.0 entry

There is no git commit `chore: bump version to 0.5.0`. The history jumps from 0.4.0 directly to 0.5.1. Decision: skip 0.5.0 entirely — it was never released.

### OpenSpec config rule placement

The "update CHANGELOG.md" reminder belongs in `openspec/config.yaml` under `rules.tasks`. This injects the rule into every auto-generated `tasks.md` without requiring a per-change decision. The config file already has a commented-out `rules:` block as an example; we uncomment and extend it.

**Alternatives considered:** Adding it to the `openspec-archive-change` skill prompt. Rejected — that's harder to discover and requires editing the skill file rather than project config.

## Risks / Trade-offs

- **Content staleness** — the CHANGELOG reflects git history as of today; future releases must be manually updated. The config.yaml tasks rule mitigates this by putting it in every generated task list.
- **v0.1.0 scope** — the initial version contained many features that in a mature project would span multiple versions. The changelog will accurately reflect this density; no rewriting of history.

## Migration Plan

1. Write `docs/CHANGELOG.md` (new file, no existing content to migrate)
2. Update `openspec/config.yaml` with tasks rule
3. No code changes; no rollback needed
