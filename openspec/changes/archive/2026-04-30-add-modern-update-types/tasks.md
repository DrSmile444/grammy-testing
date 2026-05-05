## 1. user.reactTo — message_reaction

- [x] 1.1 Add `ReactToOptions<TContext>` interface and `reactTo(reply, reaction, options?)` method to `User` in `src/high-level/user.ts`; accept `ReactionType | string`; auto-wrap plain string as `{ type: 'emoji', emoji }`
- [x] 1.2 Export `ReactToOptions` from `src/index.ts`

## 2. user.answerPoll — poll_answer

- [x] 2.1 Add `AnswerPollOptions<TContext>` interface and `answerPoll(reply, optionIndices, options?)` method to `User`; throw if `reply` does not contain a poll
- [x] 2.2 Export `AnswerPollOptions` from `src/index.ts`

## 3. user.requestJoin — chat_join_request

- [x] 3.1 Add `RequestJoinOptions` interface and `requestJoin(group, options?)` method to `User`; accept `Group | Supergroup`; throw for unsupported chat types
- [x] 3.2 Export `RequestJoinOptions` from `src/index.ts`

## 4. group/supergroup.dispatchMemberUpdate — chat_member

- [x] 4.1 Add `DispatchMemberUpdateOptions` interface and `dispatchMemberUpdate(fromAdmin, targetUser, newStatus, options?)` to `Group` in `src/high-level/group.ts`; use existing `makeChatMember` from `dispatch.ts`
- [x] 4.2 Add the same method to `Supergroup` in `src/high-level/supergroup.ts`
- [x] 4.3 Export `DispatchMemberUpdateOptions` from `src/index.ts`

## 5. channel.editPost — edited_channel_post

- [x] 5.1 Add `EditPostOptions` interface and `editPost(messageId, newText, options?)` to `Channel` in `src/high-level/channel.ts`
- [x] 5.2 Export `EditPostOptions` from `src/index.ts`

## 6. user.boostChat / user.removeBoost — chat_boost / removed_chat_boost

- [x] 6.1 Add `BoostChatOptions` interface and `boostChat(chat, options?): Promise<string>` method to `User`; generate a `boost_id`; dispatch `chat_boost` update; return the `boost_id`
- [x] 6.2 Add `RemoveBoostOptions` interface and `removeBoost(chat, boostId, options?): Promise<void>` method to `User`; dispatch `removed_chat_boost` update
- [x] 6.3 Export `BoostChatOptions` and `RemoveBoostOptions` from `src/index.ts`

## 7. README — Business API exclusion note

- [x] 7.1 Add a "Not covered" section to `README.md` listing excluded update types (`business_connection`, `business_message`, `edited_business_message`, `deleted_business_messages`, `managed_bot`, `purchased_paid_media`) with a brief reason

## 8. Tests

- [x] 8.1 Create `tests/reference/modern-update-types.spec.ts` with one test per new verb covering the primary scenario

## 9. Quality gate

- [x] 9.1 Run `npm run typecheck` — passes
- [x] 9.2 Run `npm run lint` — passes
- [x] 9.3 Run `npm run test:run` — passes
- [x] 9.4 Run `npm run test:coverage` — passes at 80%+

## 10. Versioning

- [x] 10.1 Bump `version` in `package.json` from `0.5.1` to `0.6.0` (minor — backward-compatible new verbs)
