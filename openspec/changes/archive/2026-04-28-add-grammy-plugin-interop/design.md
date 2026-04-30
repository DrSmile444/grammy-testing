## Context

`@grammyjs/testing` intercepts outgoing API calls via a transformer and dispatches synthetic updates via `bot.handleUpdate`. Plugins generally fall into one of three interaction models with this approach:

1. **Middleware plugins** (`@grammyjs/parse-mode`, `@grammyjs/hydrate`) — register middleware that transforms context fields. These are transparent to the testing framework; no special setup needed.
2. **Session-backed plugins** (`@grammyjs/conversations`, `@grammyjs/menu`, `@grammyjs/chat-members`) — require session middleware to be installed. `mockSession` / `mockChatSession` already exist for this purpose.
3. **Transport plugins** (`@grammyjs/runner`, `@grammyjs/files`) — change how updates arrive or how files are fetched. Incompatible with the synchronous `handleUpdate` dispatch model or require real Telegram infrastructure; deferred.

## Goals / Non-Goals

**Goals:**

- One test file per supported plugin demonstrating the minimal working recipe.
- Tests are self-contained: install the plugin, run a test, assert on output — no external infrastructure.
- Each file has a JSDoc header that names the recipe pattern and any known constraints.

**Non-Goals:**

- Full test suite coverage of each plugin's own functionality. We test that _our framework_ works _with_ the plugin, not the plugin itself.
- `@grammyjs/runner` — requires polling/webhook infrastructure incompatible with `handleUpdate` dispatch.
- `@grammyjs/files` — requires a real `file_id` from Telegram; no synthetic substitute.
- `@grammyjs/fluent` — adds i18n setup complexity without exercising a new testing pattern; not enough value for the pitch.

## Decisions

**Decision 1: `tests/plugins/` as a dedicated directory, separate from `tests/reference/`.**

The reference suite proves pattern coverage. The plugin interop suite proves ecosystem compatibility. Different audiences, different failure modes. Keeping them separate makes CI failures easier to diagnose.

**Decision 2: Each plugin test file installs the plugin inside the test, not as a shared fixture.**

Isolated setup per test file means each file can be read independently (grammY team reviewer can open one file and understand the full recipe). A shared `setup.ts` fixture would hide the important parts.

**Decision 3: `@grammyjs/conversations` recipe uses `MemorySessionStorage`.**

Conversations requires a session middleware. Using `MemorySessionStorage` (built into grammY core) keeps the recipe dependency-free and demonstrates the canonical way to test conversation flows without a real database.

**Decision 4: `@grammyjs/menu` recipe drives menus via `reply.clickButton`.**

The existing `clickButton(matcher)` verb on `Reply` is the natural way to interact with inline keyboards. The recipe demonstrates this pattern explicitly, closing any doubt about whether menu-driven flows are testable.

**Decision 5: Skip `@grammyjs/hydrate` as a separate test — it has no testable behavior difference.**

`@grammyjs/hydrate` adds methods to context objects (e.g., `ctx.msg.delete()`). These methods proxy to the API, so testing them is identical to testing `ctx.deleteMessage()` — the captured outgoing method is the same. A one-line note in the `parse-mode` test suffices.

**Decision 6: `@grammyjs/chat-members` recipe uses `user.joinChat` / `user.leaveChat`.**

These verbs already dispatch `new_chat_members` / `left_chat_member` service messages, which is exactly what `chat-members` plugin tracks. No new framework support needed.

## Risks / Trade-offs

- Plugin versions may diverge from what grammY team expects. Pinning to a range (`^x.y`) is correct; exact versions will be whatever `npm install` resolves.
- `@grammyjs/conversations` has a complex async execution model. Tests must `await` each step explicitly. The recipe should show this clearly with inline comments.
- If a plugin's internal session format changes between versions, tests may fail on future installs. This is expected behavior for plugin tests — document it in the JSDoc header.
