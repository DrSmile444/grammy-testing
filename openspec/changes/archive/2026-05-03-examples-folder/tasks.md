## 1. Project Setup

- [x] 1.1 Add `"examples"` to the `include` array in `tsconfig.json`
- [x] 1.2 Create the `examples/` directory at the repo root

## 2. Tier 1 — Core Dispatch (examples 01–04)

- [x] 2.1 Create `examples/01-echo-bot/bot.ts` — `createEchoBot()` factory, echoes any text back
- [x] 2.2 Create `examples/01-echo-bot/bot.spec.ts` — tests `sendText`, `user.replies.lastOrThrow()`, `reply.text`
- [x] 2.3 Create `examples/02-command-bot/bot.ts` — handles `/start` and `/help` commands
- [x] 2.4 Create `examples/02-command-bot/bot.spec.ts` — tests `sendCommand` for both commands
- [x] 2.5 Create `examples/03-greeting-bot/bot.ts` — `/greet` replies with the user's first name
- [x] 2.6 Create `examples/03-greeting-bot/bot.spec.ts` — tests with custom `{ firstName }` user profile
- [x] 2.7 Create `examples/04-chat-type-filter-bot/bot.ts` — `/info` behaves differently in private vs group
- [x] 2.8 Create `examples/04-chat-type-filter-bot/bot.spec.ts` — tests `newSupergroup`, `group.own()`, no-reply in group

## 3. Tier 2 — Inline Keyboards & Callback Queries (examples 05–06)

- [x] 3.1 Create `examples/05-inline-keyboard-bot/bot.ts` — `/menu` sends an inline keyboard; button click edits the message
- [x] 3.2 Create `examples/05-inline-keyboard-bot/bot.spec.ts` — tests `reply.buttons`, `reply.clickButton()`, `chats.editsFor()`
- [x] 3.3 Create `examples/06-callback-query-bot/bot.ts` — handles callback queries dispatched without a prior message
- [x] 3.4 Create `examples/06-callback-query-bot/bot.spec.ts` — tests `user.sendCallbackQuery()` directly

## 4. Tier 3 — Sessions (examples 07–08)

- [x] 4.1 Create `examples/07-session-counter-bot/bot.ts` — `/count` increments a per-user counter stored in session
- [x] 4.2 Create `examples/07-session-counter-bot/bot.spec.ts` — tests `mockSession`, counter persists across calls
- [x] 4.3 Create `examples/08-chat-settings-bot/bot.ts` — `/mute` and `/unmute` store a per-chat mute flag in chat session
- [x] 4.4 Create `examples/08-chat-settings-bot/bot.spec.ts` — tests `mockChatSession`, setting shared between users in same chat

## 5. Tier 4 — Media (examples 09–10)

- [x] 5.1 Create `examples/09-photo-bot/bot.ts` — echoes photo back with a caption prefix
- [x] 5.2 Create `examples/09-photo-bot/bot.spec.ts` — tests `user.sendPhoto()`, asserting `sendPhoto` outgoing API call
- [x] 5.3 Create `examples/10-document-bot/bot.ts` — replies with the document's file_id and MIME type
- [x] 5.4 Create `examples/10-document-bot/bot.spec.ts` — tests `user.sendDocument()`, file_id in reply

## 6. Tier 5 — Polls (example 11)

- [x] 6.1 Create `examples/11-poll-bot/bot.ts` — `/poll` creates a quiz poll; bot responds to answers
- [x] 6.2 Create `examples/11-poll-bot/bot.spec.ts` — tests `user.answerPoll()`, correct/incorrect answer handling

## 7. Tier 6 — Groups & Membership (examples 12–14)

- [x] 7.1 Create `examples/12-group-welcome-bot/bot.ts` — welcomes new members when they join a group
- [x] 7.2 Create `examples/12-group-welcome-bot/bot.spec.ts` — tests membership join dispatch, welcome message assertion
- [x] 7.3 Create `examples/13-admin-guard-bot/bot.ts` — `/admin-only` command rejected for non-admins
- [x] 7.4 Create `examples/13-admin-guard-bot/bot.spec.ts` — tests `chats.newAdmin()`, rejection path for regular users
- [x] 7.5 Create `examples/14-moderation-bot/bot.ts` — `/ban <userId>` kicks a user from the group
- [x] 7.6 Create `examples/14-moderation-bot/bot.spec.ts` — tests `group.ban()`, asserting `kickChatMember` in outgoing calls

## 8. Tier 7 — Channels (example 15)

- [x] 8.1 Create `examples/15-channel-post-bot/bot.ts` — `/post <text>` sends a message to a linked channel
- [x] 8.2 Create `examples/15-channel-post-bot/bot.spec.ts` — tests `chats.newChannel()`, `Channel` actor, channel message assertion

## 9. Tier 8 — Reactions & Dice (examples 16–17)

- [x] 9.1 Create `examples/16-reactions-bot/bot.ts` — tracks emoji reactions on messages and replies with a count
- [x] 9.2 Create `examples/16-reactions-bot/bot.spec.ts` — tests `user.reactTo()`
- [x] 9.3 Create `examples/17-dice-game-bot/bot.ts` — `/roll` sends a dice; bot replies with "win" or "lose" based on value
- [x] 9.4 Create `examples/17-dice-game-bot/bot.spec.ts` — tests `user.sendDice()`, reading dice value from response

## 10. Tier 9 — Middleware & Composer Isolation (examples 18–19)

- [x] 10.1 Create `examples/18-middleware-test/bot.ts` — a rate-limiting middleware that blocks rapid repeated messages
- [x] 10.2 Create `examples/18-middleware-test/bot.spec.ts` — tests `prepareMiddleware`, allowed and blocked paths
- [x] 10.3 Create `examples/19-composer-test/bot.ts` — a language-picker feature composer (command + callback query)
- [x] 10.4 Create `examples/19-composer-test/bot.spec.ts` — tests `prepareComposer`, isolated from full bot

## 11. Tier 10 — Multi-Actor Scenario (example 20)

- [x] 11.1 Create `examples/20-multi-chat-scenario/bot.ts` — bot handles users in a group and posts summaries to a channel
- [x] 11.2 Create `examples/20-multi-chat-scenario/bot.spec.ts` — tests multiple users, a supergroup, and a channel interacting in one scenario

## 12. Quality Gate

- [x] 12.1 Run `npm run lint:fix` and fix all errors
- [x] 12.2 Run `npm run format:md` and fix all formatting
- [x] 12.3 Run `npm run typecheck` and fix all type errors
- [x] 12.4 Run `npm run lint` and confirm zero errors
- [x] 12.5 Run `npm run test:run` and confirm all tests pass (including examples)
- [x] 12.6 Run `npm run test:coverage` and confirm all thresholds pass

## 13. Changelog & Version Bump

- [x] 13.1 Add entry to `docs/CHANGELOG.md` under a new version heading describing the examples folder
- [x] 13.2 Bump version in both `package.json` and `jsr.json` to the same new version string
