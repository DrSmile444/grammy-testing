## Context

The project's vision document (`docs/project.md`, ~940 lines) was authored as a one-shot strategy artifact before any code existed. It included specific commitments that have since been relaxed or contradicted:

- **Migration commitment**: the doc said the v1 acceptance test was a green migration PR against `MoC-OSS/ua-anti-spam-bot` deleting that bot's `src/testing/`. Conversation-driven exploration before v0.1 implementation reframed this: the bot is an inspiration corpus, parity is proven by re-implementing patterns *here*, not by editing the bot.
- **API-shape ambiguity**: several decisions were left open in the doc (one polymorphic vs three explicit entry points, whether `Admin` is an identity class, reply ownership semantics, async-tracking strategy, file-capture timing, conversations-plugin coupling). All of these were resolved during v0.1 design and need to be recorded.
- **Phase plan**: the doc treats v1 as one big release. Implementation reality is a v0.1 → v0.2 → v0.3 split, with v0.1 already shipped as the low-level primitives.

Until the doc reflects current reality, every future proposal that references it inherits stale framing, and any external contributor reading the repo sees a different project than the one we're actually building.

## Goals / Non-Goals

**Goals:**
- `docs/project.md` is internally consistent with the v0.1 spec capabilities and the locked-in design decisions.
- A future contributor can read the doc end-to-end and form an accurate picture of the project's strategic direction without having to cross-reference archived OpenSpec changes.
- The OpenSpec `project-vision` capability becomes a durable cross-reference for "what does the doc commit us to?", so the next time decisions evolve, we know what to update.

**Non-Goals:**
- Rewriting the doc from scratch. Most of the doc (mental model, performance bar, multi-runtime support, plugin interop list, name discussion, license/hygiene, roadmap) stays. We're surgical-editing the contradictory sections.
- Restructuring section order. We add one new section (Phase plan) but leave the rest of the table-of-contents untouched.
- Editing README, CONTRIBUTING, examples folder, or any code docstrings — those are downstream of this doc and will follow when their own proposals land.
- Adding new strategic decisions. This change records what already-decided things look like in the doc; it does not introduce new policy.

## Decisions

### D1. Capture the strategic record in OpenSpec, not just the doc

**Decision:** Add a `project-vision` capability spec at `openspec/specs/project-vision/spec.md`. The spec contains testable requirements ("doc SHALL document the inspiration-only relationship to ua-anti-spam-bot", "doc SHALL describe the v0.1/v0.2/v0.3 phase split", etc.). The doc itself is the implementation; the spec is the durable contract.

**Rationale:** Without a spec entry, future doc drift goes uncaught — someone could rewrite section X next year and lose the "no migration" commitment. With the spec, validators (or a human reading `openspec/specs/`) see exactly what the doc must continue to say. This is the same principle the rest of the project uses for code: spec defines intent, code/doc implements it.

**Alternatives considered:**
- Doc-only change (no spec). Rejected: drift is the entire problem this proposal addresses; we need the spec to bind future changes.
- Multiple specs (one per strategic theme). Rejected: forced separation when the themes are deeply linked. One coherent spec is easier to keep consistent.

### D2. Surgical edits, not rewrite

**Decision:** Edit specific sections in-place rather than reauthoring the whole doc.

**Rationale:** The doc has high-quality material that's still accurate (mental model, performance bar, plugin interop, naming, license, multi-runtime). A rewrite would risk losing nuance and would be a much bigger review surface. Edit boundaries are bounded and reviewable.

**Alternatives considered:**
- Full rewrite. Rejected: blast radius too large for the actual scope of changes (4 strategic shifts).

### D3. Phase plan as a new section, not embedded in §"Versioning"

**Decision:** Add a top-level §"Phase plan (v0.1 / v0.2 / v0.3)" between the existing §"Goals" and §"Purpose & mental model".

**Rationale:** Phase plan is *strategy*, not *release mechanics* — it belongs near the goals, not near the changeset/changelog discussion. Putting it up top makes it impossible for a reader to miss when scanning the doc. It also explicitly maps each phase to its OpenSpec change so future proposals don't get confused about "is this v0.2 work or v0.3?".

**Alternatives considered:**
- Embed in §"Versioning & release plan". Rejected: that section is about npm-mechanics (semver, dist-tags, changelog) — orthogonal to phase content.
- Embed in §"Goals". Rejected: makes Goals unwieldy and conflates "what we want" with "in what order".

### D4. Trim, don't delete, the §"Reference implementation: ua-anti-spam-bot" content

**Decision:** Keep the entire ten-pattern walkthrough of the bot's testing patterns. Edit only the framing — remove migration-target language, keep inspiration-corpus language.

**Rationale:** The pattern walkthrough is genuinely useful as a "here's what real bot tests look like" reference. It's already framed as inspiration in most of the prose. Deleting it would discard real signal; trimming the framing keeps the value.

**Alternatives considered:**
- Move to a separate file. Rejected: doubles the maintenance burden, and the walkthrough makes most sense in the same doc as the strategic context.

### D5. The `project-vision` spec uses `doc-presence` scenarios

**Decision:** Each requirement in `project-vision/spec.md` has scenarios shaped like "WHEN a reader greps `docs/project.md` for X / THEN they find Y". This is intentionally simpler than typical behavior specs.

**Rationale:** This is a doc-binding spec, not a system-behavior spec. The "test" is "does the doc say it?" — measurable by inspection. Pretending the scenarios are more complex than they are would be performance, not value.

**Alternatives considered:**
- Treat `project-vision` as a behavior spec ("the project SHALL not migrate ua-anti-spam-bot"). Rejected: that's a project policy, not a system behavior — the spec format would be awkward.

## Risks / Trade-offs

- **Doc drift between proposal date (2026-04-27) and merge** → Mitigation: this change is small-blast-radius. If any new strategic decision lands between proposal and merge, fold it into this change before archive rather than deferring to a follow-up.
- **`project-vision` spec creates a new "what counts as a doc-touching change" question** → Mitigation: future doc edits to non-strategic content (typo fixes, prose clarifications, adding examples) do NOT need a project-vision-touching change. Only edits that change strategic claims do. The line is "would the spec scenarios still pass?".
- **Spec scenarios using "grep the doc" feel weak** → Mitigation: accept the weakness. The alternative (formal property-style specs) would be over-engineering for what's fundamentally a doc-binding contract. Future-us can strengthen if it becomes a problem.

## Migration Plan

This is a doc-only change with no runtime impact.

1. Edit `docs/project.md` per the section list in proposal.md.
2. Create `openspec/specs/project-vision/` (the sync step at archive time).
3. No deploy. No rollback. If a future change makes a section in the doc wrong, that future change opens a new `update-project-vision` proposal — same process, different content.

## Open Questions

- Do we want to additionally remove §"What Grammy says" (the quoted block from grammy.dev)? It's still accurate but feels stale stylistically. **Default for now: keep as-is, can be cleaned up in a future doc-polish pass.**
- Should the `project-vision` spec include a requirement about "doc changes require a separate change proposal"? This makes the doc self-binding. **Default for now: yes — include as one final requirement, since otherwise the spec doesn't actually bite.**
