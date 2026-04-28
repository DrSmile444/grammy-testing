## Context

`project-vision/spec.md` defines the v1.0 acceptance gate as "every reference-suite test passes". That spec deliberately leaves the structure of the reference suite open — it commits to *what* the suite validates (the audited patterns from `docs/project.md`) but not *how* it organizes them.

The audited pattern list spans three layers of the API:
- High-level verbs that are fully implemented in v0.2 (`sendCommand`, `sendText` with entities, `clickButton`, `channel.postMessageTo`, `sendMediaGroup`, `chat.changeMemberStatus`, `mockSession`, `failNext` etc.).
- Low-level escape hatches that v0.2 still requires for some patterns (`NewMemberMockUpdate` / `LeftMemberMockUpdate` for service messages; `buildOverwrite()` for forwarded messages, edited messages, nested replies).
- Patterns where v0.2 has the verb but limitations apply (e.g., `sendMediaGroup` items carry placeholder photo arrays since full media verbs ship in v0.2.x).

The reference suite's job is to **stress every category and surface the friction**. A pattern that needs `buildOverwrite()` is a flag for a future v0.2.x verb. A pattern that lands cleanly is a green light for the API as shipped.

`ua-anti-spam-bot/tests/` is the inspiration source: ~400 specs across `bot.spec.ts`, `edit-message.spec.ts`, and `tests/bot/{commands,composers,handlers,listeners,messages,middleware,plugins,queries,session-providers,transformers}/`. We do NOT re-implement all 400 — the audit picks the patterns, not the assertions.

## Goals / Non-Goals

**Goals:**

- Every audited pattern category has at least one passing reference-suite test using the v0.2 API.
- Every escape-hatch usage (any non-trivial `buildOverwrite()`, any low-level `MockUpdate` constructor in reference tests) is annotated with a "v0.2.x gap: <description>" comment so the catalog stays current.
- A contributor can read any single reference-suite file and understand: what the pattern is, where it comes from in `ua-anti-spam-bot`, how `@grammyjs/testing` expresses it, and what limitations (if any) exist today.
- The reference-suite README has a running gap catalog usable as the input to v0.2.x proposal sequencing.

**Non-Goals:**

- Coverage parity at the *test count* level. The anti-spam suite has ~400 tests; the reference suite ships with ~30–50. We're proving each *pattern* works, not exhaustively retesting the bot's domain logic.
- Domain-specific assertions. The reference suite tests "does my bot's reaction to a forwarded message dispatch correctly?", not "does the anti-spam bot's swindler detector flag this exact message?".
- Adding new API verbs. Any gap surfaced is documented; the implementation is a separate proposal.
- Cross-runner verification (Vitest + Jest). Vitest only here; Jest matrix lands in `add-runtime-and-runner-support`.

## Decisions

### D1. Organize by pattern category, not by capability

**Decision:** `tests/reference/<pattern-category>.spec.ts` rather than `tests/reference/<capability>.spec.ts`.

**Rationale:** A test author asks "how do I test commands?" — not "how do I test `user-actor`?". Pattern categories map directly to what readers want to find. Capability folders already exist under `tests/high-level/` and `tests/low-level/` — they're for *unit* coverage. The reference suite is *integration* coverage, organized by user intent.

**Alternatives considered:**

- Mirror the inspiration's `tests/bot/{commands,composers,handlers,...}` structure. Rejected: that taxonomy is bot-architecture-specific (composers vs handlers is an internal grammY split that doesn't matter to a test reader).
- One mega-file `tests/reference/everything.spec.ts`. Rejected: discoverability tanks; gap-cataloging becomes painful.

### D2. Header block per file: source / pattern / API expression / gaps

**Decision:** Every reference-suite file starts with a JSDoc-style block:

```ts
/**
 * Pattern: <category name>
 *
 * Source: ua-anti-spam-bot/<file>:<line range>
 * Inspired-by tests: ~<N>
 *
 * What this exercises: <one-sentence description>
 *
 * v0.2 API expression: <verbs used>
 *
 * v0.2.x gaps: <if any>
 */
```

**Rationale:** Forces the author (us) to be explicit about *why* each file exists and *what's missing*. The format is grep-friendly so the gap catalog can be regenerated mechanically (`grep -rn "v0.2.x gap" tests/reference/`).

**Alternatives considered:**

- README-only documentation. Rejected: header lives next to the code that demonstrates it; doc drift is reduced.
- No documentation header. Rejected: the suite's whole purpose is meta — each file is "here's how to express X"; without prose framing, it reads as just more tests.

### D3. Use the v0.2 high-level API by default; reach for low-level only when v0.2 cannot express the pattern

**Decision:** Each test starts from the highest-level surface available. Order of preference:

1. `chats.newUser()` + `user.sendCommand()` / `user.sendText()` / `chat.changeMemberStatus()` etc. (v0.2 verbs).
2. `chat.changeMemberStatus()` with explicit `from`/`to`/`permissions` for transitions that don't fit `promote`/`restrict` shorthand.
3. `chats.outgoing.failNext()` / etc. for error simulation.
4. `buildOverwrite()` on a low-level `MockUpdate` ONLY when no v0.2 verb exists (and tag the test with a `v0.2.x gap` note).
5. Inline custom `Update` construction passed to `bot.handleUpdate` ONLY when even the v0.1 `MockUpdate` builders can't model the shape (and tag it).

**Rationale:** The reference suite is the dogfooding canary. If we reach for `buildOverwrite()` reflexively, we won't notice friction the API should remove. Forcing the high-level path first generates the gap catalog organically.

### D4. The capability spec is small and stable

**Decision:** `reference-suite/spec.md` defines four requirements:

1. The reference suite exists at `tests/reference/` with one file per pattern category.
2. Every audited pattern has at least one passing test.
3. Every escape-hatch usage is tagged.
4. The README's gap catalog matches the tagged escape-hatch usages.

**Rationale:** The spec is meta-documentation, not behavior. Future audits add patterns (= modify req 2); future v0.2.x verbs that close gaps (= modify req 3 / catalog). The structural commitments stay stable.

**Alternatives considered:**

- A long spec listing every pattern as a separate requirement. Rejected: redundant with the file-level header blocks; brittle on every pattern addition.

### D5. The README gap catalog is a markdown table

**Decision:** `tests/reference/README.md` includes a table of currently-tagged gaps:

| Pattern | Current expression | v0.2.x verb proposal |
| --- | --- | --- |
| Forwarded messages | `buildOverwrite({ message: { forward_origin: ... } })` | `add-forwarded-message-dispatch` |
| Service messages | `NewMemberMockUpdate` / `LeftMemberMockUpdate` low-level | `add-service-message-verbs` |
| ... | ... | ... |

**Rationale:** Tabular form is grep-friendly, scan-friendly, and gives a clear map between "what hurts now" and "which proposal fixes it". The proposal-name column is *suggestive*, not binding — we don't pre-commit to those proposal names.

## Risks / Trade-offs

- **Reference suite drifts from the audited pattern list as the bot evolves** → Mitigation: the audit lives in `docs/project.md` §"Reference test suite". A new pattern in the bot triggers a doc update + a reference-suite proposal that adds tests for it.
- **Some patterns may not have analogous v0.2 expressions** → That's the *point*. Each becomes a tagged gap and feeds the v0.2.x roadmap.
- **The reference suite catches integration regressions but not unit regressions** → Mitigation: it's a complement to `tests/high-level/` and `tests/low-level/`, not a replacement. Unit + reference + (future) plugin-interop together cover the test pyramid.
- **The "v0.2.x gap" tag becomes stale if a v0.2.x verb lands but the reference suite isn't updated** → Mitigation: each v0.2.x verb proposal that closes a gap MUST modify the reference-suite spec to drop the tag (require pattern moves to v0.2 expression). The OpenSpec workflow makes this enforceable.
- **`tests/reference/` cross-pollutes with anti-spam-specific terminology** → Mitigation: per `docs/project.md` §"Sourcing example content", we strip domain language. A reference test demonstrates "the bot reacts to forwarded messages", not "the bot detects swindler messages in forwards".

## Migration Plan

This is purely additive. No code changes, no spec modifications to existing capabilities. The `tests/reference/` directory is created from scratch; tests run alongside the existing 90 specs without interaction.

Rollback: delete `tests/reference/`. No persistent state, no API changes.

## Open Questions

- **Should `tests/reference/` tests count toward coverage?** Today's `vitest.config.ts` has 80% coverage thresholds across statements/branches/functions/lines and excludes `**/*.spec.ts` from coverage. Reference-suite tests are spec files, so they exercise `src/` like every other test — they DO contribute to coverage. **Default for now: yes, no special handling needed.** Revisit if coverage metrics get noisy from reference-only paths.
- **Should the README gap catalog be auto-generated from grep, or hand-maintained?** Auto-generated is harder to drift but adds tooling. **Default for now: hand-maintained, with the proposal's task list explicitly cross-checking gaps tagged in code vs gaps listed in README.** Auto-generation is a follow-up if drift becomes a problem.
- **Where do anti-spam-domain test patterns live if not here?** They stay in the `ua-anti-spam-bot` repo. The reference suite imports nothing domain-specific. **No action needed in this proposal.**
