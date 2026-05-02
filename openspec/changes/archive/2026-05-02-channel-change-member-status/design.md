## Context

`Channel`, `Group`, and `Supergroup` all track membership in a `members: Map<number, Membership>`. `Group` and `Supergroup` expose `changeMemberStatus(user, transition)` which dispatches `my_chat_member` and updates `members`. `Channel` has the map but no dispatch verb.

A silent semantic bug exists in `Group`/`Supergroup`: `changeMemberStatus` keys `members` by the **trigger actor's** id and passes that actor's user object to both the `from` field and `old/new_chat_member.user` in the dispatched update. In Telegram, `my_chat_member.from` is the admin who triggered the change and `old/new_chat_member.user` is always the **bot** (the party whose status changed). Because `members` holds the wrong user, `getChatAdministrators` auto-derivation returns the trigger actor as admin instead of the bot.

The change fixes this across all three types and adds `Channel.changeMemberStatus`.

## Goals / Non-Goals

**Goals:**
- Add `Channel.changeMemberStatus(fromUser, transition)` with correct `from`/subject semantics
- Fix `Group.changeMemberStatus` and `Supergroup.changeMemberStatus` to key `members` by `bot.botInfo.id`
- Make `getChatAdministrators` auto-derivation return the bot after a promotion transition
- Add `CHANNEL_ADMIN_RIGHTS` constant with channel-appropriate defaults (`can_post_messages: true`)
- Eliminate the last raw `handleUpdate` call in ua-anti-spam-bot's test suite

**Non-Goals:**
- `Channel.own()` or `Channel.join()` — channel subscriber semantics don't map to bot test states
- Fixing `dispatchMyChatMember` usage in low-level tests (those construct raw updates, not affected)
- Any change to `promote()`, `restrict()`, `own()`, `join()` — those set user state, not bot state

## Decisions

### Decision 1: Add `botUser` field to `MyChatMemberDispatch`

`MyChatMemberDispatch` (private interface in `dispatch.ts`) currently uses one `user` for both `from` and the chat-member subject. We split it:

```ts
interface MyChatMemberDispatch<TContext extends Context> {
  chat: Chat.ChannelChat | Chat.GroupChat | Chat.SupergroupChat;
  user: User<TContext>;       // from — who triggered the change
  botUser: TelegramUser;     // subject — old/new_chat_member.user (always the bot)
  fromStatus: ChatMemberStatus;
  toStatus: ChatMemberStatus;
  permissions: PermissionFlags;
  untilDate?: number;
  updateId: number;
}
```

**Alternatives considered:**
- Inlining the fix at each call site — more repetition, easier to regress.
- Deriving `botUser` inside `dispatchMyChatMember` via a `Bot` reference — would require passing the whole bot, coupling the dispatch layer to the bot lifecycle. The call site already has `bot.botInfo`, so passing `botUser` directly is cleaner.

### Decision 2: Key `members` by `bot.botInfo.id` in all three chat types

After `changeMemberStatus(fromUser, { to: 'administrator' })`, the membership map entry for the bot (not the trigger actor) is updated. `fromUser`'s own membership entry is not touched.

```ts
// Before (wrong):
this.members.set(user.id, { user, chat: this, status: transition.to, ... });

// After (correct):
const botUser = this.bot.botInfo as TelegramUser;
this.members.set(botUser.id, { user: botUser as unknown as User<TContext>, chat: this, status: transition.to, ... });
```

`bot.botInfo` is guaranteed non-null after `[setBotRef]` is called, which happens during `prepareBot`/`prepareComposer`/`prepareMiddleware` startup — before any test runs.

**Alternatives considered:**
- Introducing a `BotUser` type to avoid the cast — unnecessary complexity; `botInfo` is a `UserFromGetMe` which is compatible with `Membership.user`.

### Decision 3: `CHANNEL_ADMIN_RIGHTS` separate from `FULL_ADMIN_RIGHTS`

Channel admins have `can_post_messages` (not present on group admins) and do not have `can_manage_video_chats` or `can_manage_topics` (supergroup-only). A distinct constant avoids silently including group-irrelevant fields in channel dispatch payloads.

```ts
const CHANNEL_ADMIN_RIGHTS = {
  is_anonymous: false,
  can_be_edited: false,
  can_manage_chat: true,
  can_post_messages: true,
  can_edit_messages: true,
  can_delete_messages: true,
  can_invite_users: true,
  can_restrict_members: true,
  can_promote_members: false,
  can_change_info: false,
  can_pin_messages: true,
  can_post_stories: false,
  can_edit_stories: false,
  can_delete_stories: false,
} as const;
```

Overridable via `transition.permissions`.

### Decision 4: Fix Group/Supergroup in the same change

Fixing only `Channel` and leaving `Group`/`Supergroup` with the wrong semantics would create a visible inconsistency: `getChatAdministrators` would auto-derive correctly for channels but remain broken for groups. Bundling the fix avoids that split and makes the test migration in ua-anti-spam-bot complete in one PR.

## Risks / Trade-offs

- **Behavior change for `Group`/`Supergroup`** → `new_chat_member.user.id` in dispatched updates changes from `triggerUser.id` to `bot.botInfo.id`. Any test asserting on that field breaks. Audit of ua-anti-spam-bot shows no such assertions — all `changeMemberStatus` tests check `outgoing.getMethods()` or `replies.lastOrThrow().text`. Risk is low, and the prior behavior was wrong by definition.

- **`bot.botInfo` cast** → `bot.botInfo` is `UserFromGetMe` (extends `User`), compatible with `Membership.user`. The cast is safe but not type-checked. Documented in code comment.

## Migration Plan

1. Update `MyChatMemberDispatch` and `dispatchMyChatMember` in `dispatch.ts`
2. Update `Group.changeMemberStatus` and `Supergroup.changeMemberStatus`
3. Add `Channel.changeMemberStatus` with `CHANNEL_ADMIN_RIGHTS`
4. Update grammy-testing's own test suite (assertions on `new_chat_member.user`)
5. Migrate the one raw `handleUpdate` call in ua-anti-spam-bot to `channel.changeMemberStatus`
6. Bump version and add changelog entry
