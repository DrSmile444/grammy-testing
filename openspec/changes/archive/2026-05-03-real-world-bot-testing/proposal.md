## Why

grammy-testing has been developed against a single internal bot (ua-anti-spam-bot). We don't know which update dispatch patterns, actor verbs, or assertion ergonomics are missing until real-world bots try to use the library. Writing tests across a diverse set of public grammY bots is the fastest way to surface gaps.

## What Changes

- Clone 9 public grammY bots into `../_grammy-testing-integration/`
- Write handler-layer unit tests for each bot using grammy-testing + vitest (Node bots) or `deno test` (Deno bots)
- Document every pattern that required a raw `bot.handleUpdate` fallback or felt ergonomically awkward in `docs/TODO.md`
- Bump grammy to `^1.42.0` in Deno bot repos where needed (one-line change); skip if the upgrade requires significant bot-code changes
- No changes to grammy-testing source code in this change — findings drive a follow-up change

**Bots in scope:**

| Repo                                    | Runtime | Notes                          |
| --------------------------------------- | ------- | ------------------------------ |
| `bot-base/telegram-bot-template`        | Node    | scaffold/template bot          |
| `bot-base/scan-tool-bot`                | Node    |                                |
| `ptkdev/aboutmeinfo-telegram-bot`       | Node    |                                |
| `JinsoRaj/TorrentConverter`             | Node    | external torrent API           |
| `grinev/opencode-telegram-bot`          | Node    |                                |
| `remoodle/remoodle` (apps/telegram-bot) | Node    | monorepo                       |
| `dcdunkan/show-json-bot`                | Deno    | grammy v1.31.3 → bump needed   |
| `ArnabXD/AnimeDB-tgbot`                 | Deno    | grammy v1.11.0 → skip if stale |
| `dcdunkan/file-upload-bot`              | TBD     | confirm runtime first          |

## Capabilities

### New Capabilities

- `real-bot-integration-suite`: A collection of unit tests across real-world grammY bots, plus a findings log in `docs/TODO.md` recording every grammy-testing limitation discovered.

### Modified Capabilities

<!-- none — no existing spec requirements change -->

## Impact

- New directory created outside this repo: `../_grammy-testing-integration/`
- `docs/TODO.md` gains new entries for discovered gaps
- No changes to `src/`, `tests/`, or any published artifact of grammy-testing
