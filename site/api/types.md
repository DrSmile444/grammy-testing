# Types (API Reference)

All exported type aliases, interfaces, and constants from `grammy-testing`.

## Chat member types

### ChatMemberStatus

```ts
type ChatMemberStatus = 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
```

### Membership\<TContext\>

```ts
interface Membership<TContext extends Context = Context> {
  status: ChatMemberStatus;
  user: User<TContext>;
  // ... Telegram ChatMember fields
}
```

### MemberStatusTransition

```ts
interface MemberStatusTransition {
  old_status: ChatMemberStatus;
  new_status: ChatMemberStatus;
}
```

---

## Permission types

### PermissionFlags

```ts
interface PermissionFlags {
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
}
```

### PromotePermissions

```ts
interface PromotePermissions {
  can_manage_chat?: boolean;
  can_delete_messages?: boolean;
  can_manage_video_chats?: boolean;
  can_restrict_members?: boolean;
  can_promote_members?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_post_stories?: boolean;
  can_edit_stories?: boolean;
  can_delete_stories?: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
  is_anonymous?: boolean;
}
```

### RestrictPermissions

Extends `PermissionFlags` with `until_date`:

```ts
interface RestrictPermissions extends PermissionFlags {
  until_date?: number;
}
```

---

## Dispatch option types

### DispatchMemberUpdateOptions

```ts
interface DispatchMemberUpdateOptions {
  // options for dispatchMemberUpdate
}
```

### DispatchReactionCountOptions

```ts
interface DispatchReactionCountOptions {
  // options for dispatchReactionCount
}
```

### SendSystemMessageOptions

```ts
interface SendSystemMessageOptions {
  // options for sendSystemMessage
}
```

---

## Response types

### Responses

```ts
type Responses = {
  [M in Methods]?: ResponseResolver<M>;
};
```

### ResponseResolver\<TMethod\>

```ts
type ResponseResolver<TMethod extends Methods> =
  | Partial<Result<TMethod>>
  | ((payload: Payload<TMethod>, method: TMethod) => Partial<Result<TMethod>> | Promise<Partial<Result<TMethod>>>);
```

---

## Error types

### GrammyErrorSpec

```ts
interface GrammyErrorSpec {
  code: number;
  description: string;
}
```

Sugar type for `failNext`/`failAll`. The library converts this to a real `GrammyError` internally.

---

## Chat union type

### AnyChat\<TContext\>

```ts
type AnyChat<TContext extends Context = Context> = Group<TContext> | Supergroup<TContext> | Channel<TContext> | PrivateChat<TContext>;
```

---

## Constants

### GROUP_ANONYMOUS_BOT

```ts
const GROUP_ANONYMOUS_BOT: TelegramUser = {
  id: 1_087_968_824,
  is_bot: true,
  first_name: 'Group',
  username: 'GroupAnonymousBot',
};
```

### TELEGRAM_RELAY

Internal relay user used for channel-forwarded messages in groups.

---

## Re-exported from grammY

### ParseMode

```ts
type ParseMode = 'HTML' | 'Markdown' | 'MarkdownV2';
```

### GrammyError

Re-exported directly from `grammy` for convenience:

```ts
import { GrammyError } from 'grammy-testing';
```

---

## Context augmentation types (low-level)

### SessionContext\<TSession\>

```ts
interface SessionContext<TSession> extends Context {
  session: TSession;
}
```

### ChatSessionContext\<TChatSession\>

```ts
interface ChatSessionContext<TChatSession> extends Context {
  chatSession: TChatSession;
}
```

### StateContext\<TState\>

```ts
interface StateContext<TState> extends Context {
  state: TState;
}
```
