## 1. Fix `dispatchMyChatMember` internals

- [x] 1.1 Add `botUser: TelegramUser` field to the private `MyChatMemberDispatch` interface in `dispatch.ts`
- [x] 1.2 Update `dispatchMyChatMember` to use `spec.botUser` for `old_chat_member.user` and `new_chat_member.user`, keeping `spec.user` for the `from` field

## 2. Fix `Group.changeMemberStatus` and `Supergroup.changeMemberStatus`

- [x] 2.1 Pass `botUser: this.bot.botInfo as TelegramUser` to `dispatchMyChatMember` in `Group.changeMemberStatus`
- [x] 2.2 Key the `members.set` call by `this.bot.botInfo.id` (not `user.id`) and store `bot.botInfo` as the membership user in `Group.changeMemberStatus`
- [x] 2.3 Apply the same two changes to `Supergroup.changeMemberStatus`

## 3. Add `Channel.changeMemberStatus`

- [x] 3.1 Add `CHANNEL_ADMIN_RIGHTS` constant to `channel.ts` (includes `can_post_messages: true`, excludes `can_manage_video_chats` / `can_manage_topics`)
- [x] 3.2 Import `dispatchMyChatMember` in `channel.ts`
- [x] 3.3 Implement `Channel.changeMemberStatus(fromUser, transition)` — derive `fromStatus` from `members.get(bot.botInfo.id)`, call `dispatchMyChatMember`, then `members.set(bot.botInfo.id, ...)`
- [x] 3.4 Export `MemberStatusTransition` from the relevant module if not already reachable from `channel.ts`

## 4. Update grammy-testing's own test suite

- [x] 4.1 Find all existing tests that assert on `my_chat_member.new_chat_member.user.id` or `my_chat_member.old_chat_member.user.id` after a `changeMemberStatus` call and update them to expect `bot.botInfo.id`
- [x] 4.2 Add tests for `Channel.changeMemberStatus`: `from` field, `old/new_chat_member.user`, channel chat type, `getChatAdministrators` auto-derivation, trigger actor membership unchanged
- [x] 4.3 Add test for `CHANNEL_ADMIN_RIGHTS` defaults (`can_post_messages: true`) and permission override

## 5. Migrate ua-anti-spam-bot test

- [x] 5.1 In `ua-anti-spam-bot/tests/bot/queries/bot-queries.spec.ts`, replace the raw `bot.handleUpdate(...)` channel test with `channel.changeMemberStatus(triggerUser, { from: 'member', to: 'administrator' })`
- [x] 5.2 Register the channel in `chats` setup if needed (`chats.newChannel(...)`)
- [x] 5.3 Remove the `genericChannelChat` constant and the comment if no longer needed

## 6. Docs, changelog, and version bump

- [x] 6.1 Update `docs/CHANGELOG.md` with user-visible changes: new `Channel.changeMemberStatus`, fixed `from`/subject semantics in `Group`/`Supergroup`, `CHANNEL_ADMIN_RIGHTS`, `getChatAdministrators` auto-derivation fix
- [x] 6.2 Update `TODO.md` — mark item #18 resolved
- [x] 6.3 Bump version to `0.13.0` in `package.json` (breaking fix to dispatched update shape)
