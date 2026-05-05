## 1. Infrastructure

- [x] 1.1 Add `vitepress` devDependency and `docs:dev`, `docs:build`, `docs:preview` scripts to `package.json`
- [x] 1.2 Add `site/.vitepress/cache` and `site/.vitepress/dist` to `.gitignore`
- [x] 1.3 Copy `docs/Y.svg` to `site/public/logo.svg`
- [x] 1.4 Create `site/.vitepress/config.ts` with dynamic base URL, title, description, full nav/sidebar, local search, social links, and version dropdown sourced from `package.json`
- [x] 1.5 Create `site/.vitepress/theme/index.ts` that extends the default VitePress theme and imports the custom vars file
- [x] 1.6 Create `site/.vitepress/theme/style/vars.css` with the dual-mode blue palette (`#0057b7` light / `#4d9eff` dark) overriding `--vp-c-brand-1/2/3/soft`
- [x] 1.7 Create `.github/workflows/docs.yml` — builds `site/`, touches `.nojekyll`, uploads Pages artifact, deploys to GitHub Pages (adapt from `eslint-plugin-lintlord` workflow)
- [x] 1.8 Verify `npm run docs:dev` starts without errors and the homepage loads in the browser

## 2. Homepage

- [x] 2.1 Create `site/index.md` with `layout: home`, hero section (logo, tagline, "Get Started" + "API Reference" CTA buttons), four feature cards, and npm/license badges

## 3. Guide Section

- [x] 3.1 Create `site/guide/introduction.md` — what the library is, problem it solves, how it relates to grammY, ASCII architecture diagram (Bot → Transformer → Capture → Logs)
- [x] 3.2 Create `site/guide/getting-started.md` — `npm install`, first test from scratch (prepareBot → newUser → sendText → lastOrThrow), framework-agnostic
- [x] 3.3 Create `site/guide/how-it-works.md` — transformer interception, idle() promise tracking, two-layer design diagram, `onCapture` hook, `setTimeout` caveat callout
- [x] 3.4 Create `site/guide/with-vitest.md` — Vitest config (no special flags needed), project setup, import style, coverage config snippet
- [x] 3.5 Create `site/guide/with-jest.md` — ESM transform config (`--experimental-vm-modules` or `jest-environment-node`), package.json snippet, known caveats
- [x] 3.6 Create `site/guide/with-deno.md` — JSR import (`jsr:@grammyjs/testing`), `Deno.test` usage, deno.json config snippet

## 4. High-Level API Section

- [x] 4.1 Create `site/high-level/overview.md` — two-layer design philosophy, Chats-centric diagram, guide to choosing the right page
- [x] 4.2 Create `site/high-level/chats.md` — document all `Chats` factory methods (`newUser`, `newAdmin`, `newOwner`, `newGroup`, `newSupergroup`, `newChannel`, `newPrivateChat`, `newBusinessAccount`), accessors (`repliesFor`, `actionsFor`, `editsFor`, `deletionsFor`), `clear()`, `idle()`, `outgoing`; each with TypeScript signature and example
- [x] 4.3 Create `site/high-level/user.md` — all 50+ `User` dispatch methods organised into groups (Text & Commands, Media, Special Content, Group/Service Events, Inline & Callback, Reactions & Polls, Payment, Bot Management); `SendTextOptions` and other option types shown inline
- [x] 4.4 Create `site/high-level/groups.md` — `Group` and `Supergroup` classes, membership management (`join`, `own`, `promote`, `restrict`), `dispatchMemberUpdate`, `dispatchReactionCount`, `postRelayMessage`, `sendSystemMessage`; explain Group vs Supergroup distinction
- [x] 4.5 Create `site/high-level/channels.md` — `Channel` class with `postMessageTo`, `editPost`, `changeMemberStatus`, `dispatchReactionCount`, `sendSystemMessage`; cross-chat posting example
- [x] 4.6 Create `site/high-level/private-chat.md` — `PrivateChat`, relationship to `User`, `messages` log, `PrivateChat.messages` vs `user.replies` distinction
- [x] 4.7 Create `site/high-level/business-account.md` — `BusinessAccount` with `connect`, `disconnect`, `sendMessage`, `editMessage`, `deleteMessages`; full connect → send → disconnect example
- [x] 4.8 Create `site/high-level/reply.md` — `Reply` class, all accessors (`text`, `parseMode`, `entities`, `buttons`, `replyMarkup`, `chat`, `messageId`, `raw`, `replyingTo`), `clickButton()` with full send → click → assert example
- [x] 4.9 Create `site/high-level/logs.md` — `MessagesLog`, `RepliesInbox`, `ActionsLog`, `EditsLog`, `DeletionsLog`; each with `.last`, `.all`, `.length`, `.lastOrThrow()` where applicable, `.clear()`

## 5. Low-Level API Section

- [x] 5.1 Create `site/low-level/overview.md` — when to use low-level vs high-level, `@grammyjs/testing/low-level` subpath export list, links to each page
- [x] 5.2 Create `site/low-level/outgoing-requests.md` — `OutgoingRequests` full API: all typed accessors, `getAll` overloads, `push`, `clear`, `failNext`, `failAll`, `respondNext`, `clearOverrides`; error simulation example
- [x] 5.3 Create `site/low-level/session-mocking.md` — `mockSession`, `mockChatSession`, `mockState`, `mockContextField`; TypeScript signatures and one complete example each; mutation example for mockSession
- [x] 5.4 Create `site/low-level/update-builders.md` — `GenericMockUpdate`, `MessagePrivateMockUpdate`, `MessageMockUpdate`, `NewMemberMockUpdate`, `LeftMemberMockUpdate`, `MyChatMemberMockUpdate`; when to use over actor dispatch verbs
- [x] 5.5 Create `site/low-level/response-mocking.md` — `Responses`, `ResponseResolver` types; canned response example via `prepareBot` `responses` option

## 6. Recipes Section

- [x] 6.1 Create `site/recipes/sessions-and-state.md` — `mockSession` counter example, `mockChatSession` per-chat state, `mockState` for middleware; draw from `examples/07-session-counter/` and `examples/08-chat-settings/`
- [x] 6.2 Create `site/recipes/keyboards-and-buttons.md` — inline keyboard construction, `reply.clickButton()` by text, callback routing; draw from `examples/05-inline-keyboard/` and `examples/06-callback-query/`
- [x] 6.3 Create `site/recipes/error-simulation.md` — `failNext` / `failAll` for 403/429 errors, `GrammyError` assertion, recovery after error; draw from low-level error tests
- [x] 6.4 Create `site/recipes/multi-chat-scenarios.md` — multiple users, multiple chat types, cross-chat message routing; draw from `examples/20-multi-chat/`
- [x] 6.5 Create `site/recipes/conversations-plugin.md` — `@grammyjs/conversations` v2 with `okFetch` mock client, why it's needed, full conversation test cycle; draw from `examples/` conversations tests
- [x] 6.6 Create `site/recipes/menu-plugin.md` — `@grammyjs/menu` setup, menu button click via `reply.clickButton()`, state changes; draw from `examples/` menu tests
- [x] 6.7 Create `site/recipes/fire-and-forget.md` — void API calls inside handlers, `await chats.idle()` pattern, what happens if `idle()` is omitted, logging channel pattern

## 7. API Reference Section

- [x] 7.1 Create `site/api/prepare-bot.md` — `prepareBot` signature, `PrepareOptions` type (`botInfo`, `responses`, `onCapture`), `PrepareBotReturn`, usage notes
- [x] 7.2 Create `site/api/prepare-composer.md` — `prepareComposer` signature, `PrepareWithConstructorOptions` type, `PrepareComposerReturn`, custom context constructor example
- [x] 7.3 Create `site/api/prepare-middleware.md` — `prepareMiddleware` signature, `PrepareMiddlewareReturn`, single-middleware test example
- [x] 7.4 Create `site/api/chats.md` — complete `Chats` class reference: every method with type signature, parameter descriptions, return type, and notes
- [x] 7.5 Create `site/api/user.md` — complete `User` class reference: `UserProfile`, `BotUserProfile`, all option types, all method signatures; tabular format for method listing
- [x] 7.6 Create `site/api/group.md` — `Group` class reference with `PostRelayMessageOptions` type
- [x] 7.7 Create `site/api/supergroup.md` — `Supergroup` class reference; note re: inheriting all Group methods
- [x] 7.8 Create `site/api/channel.md` — `Channel` class reference with `EditPostOptions` type
- [x] 7.9 Create `site/api/private-chat.md` — `PrivateChat` class reference
- [x] 7.10 Create `site/api/business-account.md` — `BusinessAccount` class reference with all option types (`ConnectOptions`, `BusinessSendMessageOptions`, etc.)
- [x] 7.11 Create `site/api/outgoing-requests.md` — `OutgoingRequests<TMethod>`, `Request<TMethod>`, `RealApiMethodKeys`; all `getAll` overload signatures
- [x] 7.12 Create `site/api/reply.md` — `Reply<TContext>`, `MediaType`, `ReplyMedia`, `ReplyButton` reference
- [x] 7.13 Create `site/api/logs.md` — `MessagesLog<TContext>`, `RepliesInbox<TContext>`, `ActionsLog`, `EditsLog`, `DeletionsLog<TContext>`, `Deletion<TContext>`, `Edit` reference
- [x] 7.14 Create `site/api/types.md` — all exported type aliases and interfaces: `ChatMemberStatus`, `PermissionFlags`, `Membership`, `PromotePermissions`, `RestrictPermissions`, `MemberStatusTransition`, `DispatchMemberUpdateOptions`, `DispatchReactionCountOptions`, `SendSystemMessageOptions`, `ResponseResolver`, `Responses`, `GrammyErrorSpec`, `AnyChat`, `ParseMode`, `GROUP_ANONYMOUS_BOT`, `TELEGRAM_RELAY`

## 8. Reference Section

- [x] 8.1 Create `site/reference/changelog.md` — attempt symlink to `../../docs/CHANGELOG.md`; if VitePress does not resolve it during `npm run docs:build`, replace with a page containing the full changelog content copied from `docs/CHANGELOG.md`

## 9. Verification & Polish

- [x] 9.1 Run `npm run docs:build` and confirm zero errors and zero dead links (VitePress will warn on broken internal links)
- [x] 9.2 Run `npm run docs:preview` and manually verify: homepage hero, nav links, sidebar, search returns results for "prepareBot" and "User", dark mode colours, mobile sidebar
- [x] 9.3 Confirm all 42 pages are reachable from the sidebar with no 404s
- [x] 9.4 Verify logo appears in navbar and as favicon
- [x] 9.5 Verify brand colours pass WCAG AA in both light and dark mode (use browser DevTools / axe)
- [x] 9.6 Push to `main` and confirm GitHub Actions docs workflow completes and site is live at `https://drsmile444.github.io/grammy-testing/`

## 10. Quality Gate & Release

- [x] 10.1 Update `docs/CHANGELOG.md` with a new entry documenting the VitePress documentation site (new `site/` directory, GitHub Pages deployment, all 42 pages)
- [x] 10.2 Run full quality gate in order and fix every error before proceeding: `npm run lint:fix` → `npm run format:md` → `npm run typecheck` → `npm run lint` → `npm run test:run` → `npm run test:coverage`
- [x] 10.3 Bump version to next patch in both `package.json` and `jsr.json` (must be identical strings)
