## Context

The library has no real README. The current file is a TypeScript Boilerplate placeholder.
The library is published on both npm and JSR as `@grammyjs/testing` at v0.20.0.
It has two API surfaces (high-level and low-level), 20 runnable examples, and supports
Vitest and Jest. Full VitePress documentation is planned but not yet implemented.

The author wants a client-facing README that builds trust immediately, establishes yellow
(`#ffd700`) as the library's brand color, and sits naturally in the grammyjs ecosystem.

## Goals / Non-Goals

**Goals:**

- First impressions: hook, logo, badges land in 3 seconds
- Show the core value with one minimal code example
- List features without overwhelming with API surface detail
- Point to 20 examples for deeper exploration
- Reserve a docs section for the coming VitePress site
- Credit `grammy_tests` and `ua-anti-spam-bot`

**Non-Goals:**

- Full API reference (VitePress)
- Per-method documentation
- Migration guides or changelogs

## Decisions

### Logo: custom full-width banner `docs/grammy-testing-logo.svg`

The author created a dedicated `docs/grammy-testing-logo.svg` wordmark that combines the
grammY Y mark with the "testing" identity. It is rendered at full width (`width="1080"`)
as a banner above the tagline — the same pattern grammY's own README uses for its logo.
Using a local file means no external dependency at render time and no broken-image risk.

### Brand color: yellow `#ffd700`

The Y logo is inherently yellow. Using `color=ffd700` on shields.io badges gives `#000` text
on yellow automatically (shields.io picks dark text for high-luminance backgrounds) — contrast
ratio 14.85:1, WCAG AAA compliant. `labelColor=000` matches grammY's badge style, keeping the
library visually adjacent to the ecosystem while the yellow value differentiates it.

### Code example: `/start` command bot (not echo bot)

Every Telegram developer has typed `/start` into a bot. `sendCommand('/start')` communicates
the library's core idea faster than `sendText` because commands are the most recognizable
Telegram-bot interaction. Echo bot is still referenced in the examples table.

### Feature list: high-level only, low-level mentioned briefly

The high-level API (User, Group, Channel, etc.) is what 95% of users will touch. The
low-level API is listed as a one-liner at the end of the features section to avoid
overwhelming new users while still communicating it exists for advanced use cases.

### Documentation section: visible Option-B placeholder

A rendered "coming soon" section (not an HTML comment) with a pointer to examples is more
useful than invisible markup. When VitePress lands, the placeholder becomes a real link.

### Credits: dedicated section before License

`grammy_tests` and `ua-anti-spam-bot` are acknowledged with a short sentence each — honest,
professional, and consistent with open-source norms.

## Risks / Trade-offs

- **Local SVG on npm** → npm may not resolve relative image paths; the banner may not render
  on the npm package page. Mitigation: acceptable for now; the image renders correctly on
  GitHub which is the primary discovery surface. Can switch to a raw.githubusercontent.com URL
  after the repo goes public.

- **Yellow badges** → `#ffd700` is visually bold. If the ecosystem later adopts a different
  convention, badges will look inconsistent. Mitigation: trivial to update badge URLs.

## Open Questions

_(none — all design decisions settled in explore session)_
