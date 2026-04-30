## 1. Reframe the ua-anti-spam-bot relationship

- [x] 1.1 §"Niche" already framed as a general-purpose niche; no replacement-of-bot language present. No edit needed.
- [x] 1.2 §"Goals" item 2 rewritten: removed "delete the in-repo `src/testing/`"; replaced with "every pattern from the anti-spam suite is expressible cleanly in `@grammyjs/testing` and demonstrated in this repo's reference suite (planned location: `tests/reference/`)".
- [x] 1.3 §"Goals" intro paragraph rewritten to explicitly call ua-anti-spam-bot the "inspiration corpus, not a migration target".
- [x] 1.4 §"Reference implementation" intro paragraph reframed: kept "low-level reference and proof of feasibility" framing, added explicit "**not a migration target**" + "We re-implement its patterns in this repo's reference suite, without touching the bot itself".

## 2. Replace the migration milestone section

- [x] 2.1 §"Migration milestone: replace ua-anti-spam-bot's in-repo testing framework" renamed to §"Reference test suite: prove parity using anti-spam patterns".
- [x] 2.2 Section body rewritten: explains we re-implement audited patterns in `tests/reference/`; lists the patterns to demonstrate; drops the `@testing/*` swap step list; explains _why_ a migration PR was rejected (release coupling, name-parity constraints, weaker validation signal).
- [x] 2.3 Success criterion updated: "every reference-suite test passes" replaces "the migration PR merges green".
- [x] 2.4 Cross-references updated in §"Versioning & release plan" and §"Plugin's own test strategy" to point at the new section. §"Documentation strategy" line about "Anti-spam-specific tests stay in the bot repo as the migration acceptance test" rewritten to "as inspiration only".

## 3. Update the versioning & release plan

- [x] 3.1 §"Versioning" v1.0 cut criterion 1 replaced with "Every reference-suite test passes against the patterns audited in §Reference test suite".
- [x] 3.2 Added a sentence linking pre-1.0 progression to the new Phase plan section.

## 4. Add the Phase plan section

- [x] 4.1 New top-level §"Phase plan (v0.1 / v0.2 / v0.3)" inserted between §"Goals" and §"Purpose & mental model".
- [x] 4.2 Section has intro paragraph + three subsections.
- [x] 4.3 v0.1 subsection: scope, capabilities, archived OpenSpec change reference, status **shipped**.
- [x] 4.4 v0.2 subsection: scope (Chats/User/Admin/Reply, role-based admin model, three-layer reply ownership, file capture), proposed change name `add-high-level-chats-api`, status **next**.
- [x] 4.5 v0.3 subsection: scope (plugin interop, multi-runtime publish, VitePress site, JSR), proposed change names `add-grammy-plugin-interop` and `add-runtime-and-runner-support`, status **planned**.

## 5. Record the locked-in API-shape decisions

- [x] 5.1 §"Test granularity entry points": confirmed three explicit entry points wording, added rationale ("separate names give per-entry type narrowing and clearer call sites — chosen over one polymorphic `prepareBot`").
- [x] 5.2 §"Async / dispatch semantics": documented Strategy 2 explicitly; out-of-scope tracking of `setTimeout`/`setImmediate` work; rationale for choosing Strategy 2 over `async_hooks`.
- [x] 5.3 §"File / media capture": documented eager (buffer/string), tee (stream), URL-as-string decision. Updated `readBuffer` to `readBytes` returning `Uint8Array`.
- [x] 5.4 §"TypeScript & custom Context generics": added "Public-type discipline — Web-platform-shaped, not Node-shaped" paragraph documenting `Uint8Array` over `Buffer` and `ReadableStream` over `node:stream`.
- [x] 5.5 §"Error / failure simulation": added the sugar-spec form (`{ code, description }`) as the lead example; kept the four-arg `GrammyError` constructor as the escape hatch; updated variants list to note both shapes.
- [x] 5.6 §"High-level user-facing actions": reframed Admin as per-chat role; `chats.newAdmin()` documented as sugar; added `group.promote()`, `group.restrict()`, `user.in(group)` to the surface.
- [x] 5.7 §"Assertion strategy": three-layered model documented — `user.replies` (filtered view), `chat.messages` (canonical log), `chats.outgoing` (raw API capture).
- [x] 5.8 §"High-level user-facing actions": added paragraph documenting canned responses accept static value OR `(payload, method) => result` function.

## 6. Document the conversations-plugin interop approach

- [x] 6.1 §"grammY plugin interop" `@grammyjs/conversations` bullet expanded: plugin stays conversations-blind; tests wire up conversations themselves with `MemorySession`; recipe page ships in docs; rationale for avoiding version-coupling.

## 7. Layered exports framing

- [x] 7.1 §"Repository structure" now contains a "Layered public exports" subsection documenting `@grammyjs/testing` (curated default) vs `@grammyjs/testing/low-level` (escape hatch). Subpath-export portability noted (Node, Bun, Deno, JSR).

## 8. Trim the §"Reference implementation: ua-anti-spam-bot" framing

- [x] 8.1 Read through. Updated `Don't over-engineer this in v1. After the anti-spam-bot migration we'll have real failure cases` → reference-suite framing. The §"How this maps onto the plugin design" bullets already framed inspiration-style and stay as-is.
- [x] 8.2 Ten-pattern walkthrough kept intact (great teaching examples). Only intro framing adjusted.

## 9. Validation

- [x] 9.1 Doc read end-to-end. Every requirement in `specs/project-vision/spec.md` is observable: ua-anti-spam framing (§Niche/Goals/Reference test suite/Reference implementation), Phase plan section (new), API decisions (§Test granularity / Async / File capture / TypeScript / Error simulation / High-level user-facing actions / Assertion strategy / Repository structure / grammY plugin interop), v1.0 validation gate (§Versioning), self-binding via the OpenSpec process is implicit in this very change being a proposal.
- [x] 9.2 `openspec validate update-project-vision --strict` reports valid.
- [x] 9.3 `grep` for stale "migration PR" / "delete `src/testing/`" / "find-and-replace migration" — only one remaining mention is the intentional "we deliberately chose against this" paragraph in §"Reference test suite". All other migration references are either in safe contexts (inspiration framing, "not a migration target" framing) or refer to user-facing migration from `grammy_tests` (Deno) which is unrelated.
