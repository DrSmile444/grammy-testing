## 1. Pure-State Membership Setters

- [x] 1.1 Add `own(user): Membership<TContext>` to `Group` — sets `status: 'creator'`, `permissions: { is_anonymous: false }`, no dispatch
- [x] 1.2 Add `join(user): Membership<TContext>` to `Group` — sets `status: 'member'`, `permissions: {}`, no dispatch
- [x] 1.3 Add `own(user): Membership<TContext>` to `Supergroup` (same logic, `toTelegramChat()` return type differs)
- [x] 1.4 Add `join(user): Membership<TContext>` to `Supergroup`

## 2. Chats Factory Shortcut

- [x] 2.1 Add `newOwner(profile?: UserProfile): User<TContext>` to `Chats` — lazily creates `defaultGroup` (same as `newAdmin`), then calls `defaultGroup.own(user)`

## 3. Membership-to-ChatMember Converter

- [x] 3.1 Add module-level `membershipToChatMember<TContext>(membership: Membership<TContext>): ChatMember` pure function in `chats.ts` — switch on `membership.status`, spread `membership.permissions` into admin/restricted shapes, use `User` actor directly as `ChatMember.user`

## 4. Auto-Derived API Resolvers

- [x] 4.1 Add `getChatMember` resolver in `buildDefaultResponses()` — looks up chat by `chat_id`, calls `chat.members.get(user_id)`, returns `membershipToChatMember(membership)` if found, `{ status: 'left', user }` fallback if not in map, `true` for unregistered chats
- [x] 4.2 Add `getChatAdministrators` resolver — filters `chat.members` for `'creator' | 'administrator'`, maps via `membershipToChatMember`, returns `[]` for unregistered chats
- [x] 4.3 Add `getChat` resolver — returns `{ ...chat.toTelegramChat(), invite_link: '' }` for registered chats, `true` for unregistered

## 5. Tests

- [x] 5.1 Test `group.own(user)` and `supergroup.own(user)`: status is `'creator'`, no update dispatched, overwrites prior status
- [x] 5.2 Test `group.join(user)` and `supergroup.join(user)`: status is `'member'`, no update dispatched
- [x] 5.3 Test `chats.newOwner()`: creates user, sets creator in `defaultGroup`, lazily creates `defaultGroup`, accepts profile
- [x] 5.4 Test `getChatMember` auto-resolve: creator, administrator, member, restricted, left, unknown user, unregistered chat
- [x] 5.5 Test `getChatAdministrators` auto-resolve: mixed roster, excludes members, empty for unregistered chat
- [x] 5.6 Test `getChat` auto-resolve: enriched shape with `invite_link`, `true` for unregistered chat
- [x] 5.7 Test override precedence: user-supplied `responses.getChatMember` beats auto-derived value

## 6. TODO Housekeeping

- [x] 6.1 Mark TODO.md items 13 (`chats.clear()`), 14 (`unregistered chat warning`), and 15 (`postinstall`) as resolved — already done in code/commits
- [x] 6.2 Mark TODO.md items 16 (`own`/`join`) and 17 (`getChatMember` auto-derive) as resolved

## 7. Changelog and Version

- [x] 7.1 Add entry to `docs/CHANGELOG.md` covering: `group.own()`, `group.join()`, `chats.newOwner()`, auto-derived `getChatMember` / `getChatAdministrators` / `getChat`
- [x] 7.2 Bump version in `package.json` (minor — new public API surface, no breaking changes)
