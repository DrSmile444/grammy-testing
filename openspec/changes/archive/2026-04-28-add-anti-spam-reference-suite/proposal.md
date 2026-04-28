## Why

The `project-vision` spec (now in `openspec/specs/project-vision/spec.md`) commits the project to validating v1.0 readiness via an in-repo **reference suite** that re-implements every audited pattern from `ua-anti-spam-bot/tests/`. v0.1 (low-level primitives) and v0.2 (high-level Chats/User/Reply API) are now both shipped. Until the reference suite exists, two things stay open: (1) the v1.0 acceptance criterion is unmet, and (2) we have no end-to-end shake-down of the v0.2 API against real-world test patterns — friction or gaps in the high-level layer are still hypothetical.

This change lands the reference suite as a coherent, runnable artifact — a peer of `tests/low-level/` and `tests/high-level/`, but organized by *pattern* (the patterns the doc commits us to support) rather than by *capability*. Each file demonstrates how the v0.2 API expresses one category of real-bot test, with explicit notes whenever a `buildOverwrite()` or low-level escape hatch is needed (those become the catalog of v0.2.x gaps).

## What Changes

- **New top-level directory `tests/reference/`** — sibling of `tests/low-level/` and `tests/high-level/`. Organized by pattern category, NOT by capability.
- **Nine pattern files** covering every audited pattern from `docs/project.md` §"Reference test suite":
  - `commands.spec.ts` — `/start`, `/help`, `/lang en` style commands with `bot_command` entities in both private and supergroup chats; arg parsing; admin-only commands.
  - `messages.spec.ts` — text messages with custom entities (`mention`, `hashtag`, `url`, custom-offset `bot_command`); `parse_mode`; `reply_parameters`.
  - `channel-posts.spec.ts` — channel-as-author posts into a supergroup (Coverage-audit gap #3 patterns).
  - `media-groups.spec.ts` — N-update dispatch with shared `media_group_id`; caption-on-first-only; bot-side aggregation by `media_group_id`.
  - `membership.spec.ts` — `promote` / `restrict` / `changeMemberStatus` chains; admin-only command guards; restriction-with-`untilDate`.
  - `service-messages.spec.ts` — `new_chat_members` / `left_chat_member` via the v0.1 `NewMemberMockUpdate` / `LeftMemberMockUpdate` low-level escape hatch (no v0.2 verb yet — explicitly noted as a v0.2.x gap).
  - `sessions.spec.ts` — `mockSession` / `mockChatSession` / `mockState` patterns including cross-call mutation.
  - `error-simulation.spec.ts` — `failNext` / `failAll` / `respondNext` patterns; rate-limit handling; blocked-user handling; bot-side error-handler observation.
  - `menu-flows.spec.ts` — `clickButton` end-to-end flows including chained-keyboard scenarios where the bot replies with a new keyboard after a click.
- **Each file ships with a header block** documenting: the corresponding `ua-anti-spam-bot` test source (file + line range when traceable), the pattern's purpose, the v0.2 API expression, and any v0.2.x gap notes.
- **Reference-suite README** at `tests/reference/README.md` — short index linking to each file, plus the running gap catalog (patterns currently using `buildOverwrite()` or v0.1 escape hatch that should land high-level verbs in v0.2.x).
- **No new runtime code.** No changes to `src/`. No changes to `package.json`. The v0.2 API as it stands is the surface this validates.

## Capabilities

### New Capabilities

- `reference-suite`: the validation contract for v1.0 acceptance. Defines what patterns must be exercised, where the tests live, and what "passes" means. Future patterns added to the audit (and any new v0.2.x verbs that supplant existing escape-hatch usages) flow through modifications to this spec.

### Modified Capabilities

None. The v0.1/v0.2 capability specs (`bot-test-harness`, `outgoing-requests-capture`, `context-field-mocking`, `update-builders`, `chats-orchestrator`, `user-actor`, `membership-roles`, `reply-objects`, `chat-messages-log`, `media-group-dispatch`) define the **API**; this proposal defines the **validation** that the API expresses real-world patterns. Their requirements are unaffected.

## Impact

- **Source layout**: `tests/reference/` is the only additive change. ~9 spec files plus 1 README.
- **Test count**: estimated **30–50 new tests** across the nine pattern files. Each pattern category lands enough scenarios to exercise the API thoroughly (typically 3–6 tests per file).
- **CI**: existing `npm run test:run` picks up `tests/reference/**/*.spec.ts` automatically (vitest config already uses the `**/*.spec.ts` include glob).
- **v1.0 acceptance**: this proposal lands the artifact. Per `project-vision/spec.md`, v1.0 cuts when "every reference-suite test passes" — that statement becomes evaluable once this lands.
- **v0.2.x gap catalog**: the README's gap section becomes a living document. Each escape-hatch use is a future v0.2.x candidate (high-level verb proposals like `add-forwarded-message-dispatch`, `add-edited-message-dispatch`, `add-service-message-verbs`, etc.).
- **Out of scope (separate proposals)**:
  - Implementing any new high-level verb the gap catalog surfaces — those are individual v0.2.x proposals.
  - Anti-spam-domain assertions (swindler detection logic, NSFW classifier wiring, language-detection assertions). The reference suite tests the *grammY-testing API*, not the *anti-spam bot's domain logic*.
  - VitePress docs site that links to the reference suite as proof — that's `add-runtime-and-runner-support` / `add-vitepress-docs-site` (v0.3).
  - Plugin interop examples — `add-grammy-plugin-interop` (v0.3).
