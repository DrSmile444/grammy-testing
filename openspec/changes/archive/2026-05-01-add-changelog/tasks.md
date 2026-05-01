## 1. Create docs/CHANGELOG.md

- [x] 1.1 Create `docs/CHANGELOG.md` with the file header and v0.10.0 through v0.8.0 sections (newest first), using the `## X.Y.Z — YYYY-MM-DD` + named subsections structure
- [x] 1.2 Add v0.7.2 through v0.5.1 sections (patch and minor versions from Apr 29–30)
- [x] 1.3 Add v0.4.0 through v0.1.0 sections (earliest versions from Apr 27–29), with v0.1.0 using multiple named subsections for primitives, high-level API, and build/CI

## 2. Update openspec config

- [x] 2.1 Add a `rules.tasks` block to `openspec/config.yaml` that instructs every generated `tasks.md` to include an "Update `docs/CHANGELOG.md`" task as the final step before release

## 3. Verify

- [x] 3.1 Confirm all 13 version sections are present (v0.1.0, v0.1.1, v0.2.0, v0.3.0, v0.4.0, v0.5.1, v0.6.0, v0.7.0, v0.7.1, v0.7.2, v0.8.0, v0.9.0, v0.10.0) and v0.5.0 is intentionally absent
- [x] 3.2 Confirm `docs/CHANGELOG.md` is listed under `docs/` (not ignored by `.gitignore`)
