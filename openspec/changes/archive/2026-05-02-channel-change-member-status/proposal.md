## Why

`Channel` is the only chat type without `changeMemberStatus`, leaving one raw `bot.handleUpdate(...)` call in every test suite that exercises bot promotion in a channel. At the same time, `Group` and `Supergroup` have a silent bug: `changeMemberStatus` tracks the **trigger actor** in `members` instead of the **bot**, causing `getChatAdministrators` auto-derivation to return the wrong user after a membership transition.

## What Changes

- **New**: `Channel.changeMemberStatus(fromUser, transition)` — dispatches a `my_chat_member` update for the channel and updates the internal membership map.
- **New**: `CHANNEL_ADMIN_RIGHTS` constant with channel-appropriate defaults (`can_post_messages: true`, no `can_manage_video_chats` / `can_manage_topics`).
- **BREAKING (minor)**: `dispatchMyChatMember` now accepts a separate `botUser` field for the `old/new_chat_member.user` subject, distinct from `user` (the trigger actor). `old_chat_member.user` and `new_chat_member.user` in dispatched updates now reflect `bot.botInfo` instead of the trigger user.
- **Fix**: `Group.changeMemberStatus` and `Supergroup.changeMemberStatus` now store the bot's membership (keyed by `bot.botInfo.id`) in their `members` map instead of the trigger actor's.
- `chats.newChannel()` return type gains `changeMemberStatus`.
- `Channel.own()` and `Channel.join()` are **not** added — channel subscriber semantics don't map to meaningful bot test states.

## Capabilities

### New Capabilities

- `channel-change-member-status`: `Channel.changeMemberStatus` dispatch verb — constructs a `my_chat_member` update with `chat.type === 'channel'`, correct `from` / subject split, and channel-specific admin permission defaults.

### Modified Capabilities

- `membership-roles`: `changeMemberStatus` subject semantics — `old/new_chat_member.user` is now `bot.botInfo` (the party whose membership changed), and the membership map is keyed by `bot.botInfo.id`. The `fromUser` parameter remains the trigger actor populating the `from` field. `getChatAdministrators` auto-derivation now returns the bot after a promotion transition.

## Impact

- `src/high-level/channel.ts` — add `changeMemberStatus`
- `src/high-level/group.ts` — fix `changeMemberStatus` subject
- `src/high-level/supergroup.ts` — fix `changeMemberStatus` subject
- `src/high-level/dispatch.ts` — `MyChatMemberDispatch` gains `botUser` field; `dispatchMyChatMember` updated
- Tests: all existing `changeMemberStatus` call sites in grammy-testing's own suite need the subject assertion updated
- Consumers (ua-anti-spam-bot): the one raw `handleUpdate` channel test can be migrated to `channel.changeMemberStatus`
