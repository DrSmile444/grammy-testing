## Why

`@grammyjs/testing` has shipped 14 releases (v0.1.0–v0.10.0) with no changelog — users upgrading between versions have no structured record of what changed, and maintainers have no single place to see the project's evolution. A changelog is also the expected artifact when submitting a library to the grammY ecosystem.

## What Changes

- Add `docs/CHANGELOG.md` covering the full release history from v0.1.0 through v0.10.0, with one section per released version, dated and structured by feature group
- Add a `rules.tasks` entry to `openspec/config.yaml` so every future change's auto-generated `tasks.md` includes an "Update `docs/CHANGELOG.md`" task, preventing the log from going stale again

## Capabilities

### New Capabilities

- `changelog`: Human-readable release history document at `docs/CHANGELOG.md`, covering all 14 versions with per-version feature summaries

### Modified Capabilities

<!-- none — the openspec config.yaml addition is a process/tooling change, not a spec-level behavior change -->

## Impact

- `docs/CHANGELOG.md` is a new file; no existing code is touched
- `openspec/config.yaml` gains a `rules.tasks` block that affects every future change's generated `tasks.md`
