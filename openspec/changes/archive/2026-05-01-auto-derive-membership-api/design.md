## Context

`Chats.buildDefaultResponses()` already builds a dynamic resolver map for all message-sending methods — it reads `lastCapturedReply` at call-time and returns a synthetic `Message`-shaped result. The resolved map is spread with user-supplied `responses` so overrides always win:

```ts
const responses = { ...chats.buildDefaultResponses(), ...options.responses };
```

This pipeline is shared by all three entry points (`prepareBot`, `prepareComposer`, `prepareMiddleware`).

The `members` map on `Group` and `Supergroup` is the library's single source of truth for membership state. It is written by `promote()`, `restrict()`, `changeMemberStatus()`, and `applyMembershipTransition()`. The missing gap: no write path for `'creator'` or `'member'` that doesn't also dispatch an update, and no read path from `getChatMember` / `getChatAdministrators` / `getChat` into that map.

`User` actors already carry `id`, `is_bot`, `first_name`, `last_name?`, `username?` as snake_case properties, matching the Telegram `User` interface structurally. No serialization step is needed when embedding them in `ChatMember` response shapes.

## Goals / Non-Goals

**Goals:**

- Add `own(user)` and `join(user)` as pure state setters on `Group` and `Supergroup`, following the existing `promote()` / `restrict()` pattern exactly
- Add `chats.newOwner(profile?)` mirroring `chats.newAdmin()`
- Auto-derive `getChatMember`, `getChatAdministrators`, `getChat` in `buildDefaultResponses()` from the `members` map and `toTelegramChat()`
- Preserve full override capability — user-supplied `responses` entries take precedence unconditionally

**Non-Goals:**

- Auto-deriving any other Telegram API methods
- Changing the transformer or response resolution pipeline
- Modifying how `changeMemberStatus()` works (it remains the only dispatch path)
- Removing any existing method or changing any existing method's signature

## Decisions

### D1: `own()` / `join()` as pure state setters, not a flag on `changeMemberStatus()`

The existing pattern is unambiguous: `promote()` and `restrict()` write state only; `changeMemberStatus()` dispatches and writes. Adding `own()` and `join()` as pure setters keeps that invariant clean.

**Alternative considered**: `changeMemberStatus(user, { to: 'creator', silent: true })` — rejected because it merges dispatch and non-dispatch semantics into one method, making call sites harder to read and the contract harder to enforce.

### D2: `membershipToChatMember()` as a module-level pure function in `chats.ts`

The converter takes a `Membership` record and returns a `ChatMember` discriminated union. It has no dependency on `this` — it's a pure data transform. A module-level function keeps it testable and colocated with its only consumer (`buildDefaultResponses()`).

**Alternative considered**: A method on `Membership` — rejected because `Membership` is a plain data interface, not a class. Adding behavior to it would require converting it to a class or using a namespace, neither of which fits the existing style.

### D3: Use `User` actor directly as `ChatMember.user` — no plain-object copy

`User<TContext>` structurally satisfies the Telegram `User` interface (has `id`, `is_bot`, `first_name`, `last_name?`, `username?`). The extra methods and generic parameter are invisible to the consuming bot code. A plain-object copy would be redundant serialization.

**Alternative considered**: Serialize to `{ id, is_bot, first_name, ... }` — rejected as unnecessary. Structural typing handles this; no runtime difference.

### D4: `getChat` returns `invite_link: ''`, not `undefined`

`''` is falsy (satisfies `if (invite_link)` guards), and the key is present (satisfies `'invite_link' in chat` checks). It matches what the 20+ existing manual mocks use, so tests that are migrated from manual to auto-derived see identical bot behavior.

**Alternative considered**: `invite_link: undefined` — semantically honest but misses `'invite_link' in chat` checks in bot code that uses the `in` operator, and differs from the existing mock data.

### D5: Fall back to `true` for unregistered chats in `getChatMember` and `getChat`

Preserves existing behavior — tests that don't register all chats continue to receive `true` for those chats, just as they did before. A throw or `[]` would be a silent breaking change.

**Alternative considered**: Return `{ status: 'left', ... }` for unregistered chats — rejected because it changes observable bot behavior for tests that intentionally leave some chats unregistered.

## Risks / Trade-offs

- **`PermissionFlags` contains both admin and member permission keys**: Spreading `membership.permissions` into `ChatMemberAdministrator` or `ChatMemberRestricted` shapes may include irrelevant keys. Telegram's API ignores extra fields, and grammY's transformer already returns the raw object, so this is harmless in practice. → No mitigation needed.

- **Type assertion for `User<TContext>` as `ChatMember['user']`**: The generic parameter makes TypeScript treat `User<TContext>` as distinct from the bare `User` type in some contexts. A `as unknown as User` cast may be needed in the converter. → Accepted; the structural equivalence is guaranteed by the `User` class definition.

- **`getChatAdministrators` returns `[]` for unregistered chats**: This differs from the `true` fallback used for `getChatMember` and `getChat`. The rationale: an empty admin list is a safe, meaningful default; `true` is not a valid `Array`. → Consistent with what bot code expects from an empty group.

## Migration Plan

No migration required. `buildDefaultResponses()` resolvers are only active when no user-supplied override exists. Every test that currently mocks `getChatMember`, `getChatAdministrators`, or `getChat` in `responses` continues to work unchanged — the user entry wins in the spread. Tests can remove manual mocks incrementally.
