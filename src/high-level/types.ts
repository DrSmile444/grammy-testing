import type { Context } from 'grammy';
import type { ChatAdministratorRights, ChatMember, ChatPermissions } from 'grammy/types';

export type ChatMemberStatus = ChatMember['status'];

/**
 * Per-chat membership view. Returned from `group.promote`,
 * `group.restrict`, `chat.changeMemberStatus`, and `user.in(chat)`.
 *
 * `Membership` is per-chat **state**, not an identity. The same user
 * can have membership `'administrator'` in chat A and `'member'` in
 * chat B without changing classes.
 */
/**
 * Lenient permission flag bag covering both administrator rights and
 * regular member permissions. We don't try to enforce the precise
 * Telegram intersection at the type level — tests pass whichever flags
 * are relevant for the role they're modeling.
 */
export type PermissionFlags = Partial<ChatAdministratorRights & ChatPermissions> & {
  can_be_edited?: boolean;
  is_anonymous?: boolean;
  is_member?: boolean;
};

export interface Membership<TContext extends Context = Context> {
  user: import('./user').User<TContext>;
  chat: import('./chat').AnyChat<TContext>;
  status: ChatMemberStatus;
  permissions: PermissionFlags;
  untilDate?: number;
}

/**
 * Permission shape passed to `group.promote(...)`. Partial — missing
 * fields default to permissive (true) on promote.
 */
export type PromotePermissions = PermissionFlags;

/**
 * Permission shape passed to `group.restrict(...)`. Partial — missing
 * fields default to restrictive (false).
 */
export type RestrictPermissions = PermissionFlags;

export interface MemberStatusTransition {
  from?: ChatMemberStatus;
  to: ChatMemberStatus;
  permissions?: PermissionFlags;
  untilDate?: number;
}

export interface DispatchMemberUpdateOptions {
  /** Override the old member status (defaults to `'member'`). */
  oldStatus?: ChatMemberStatus;
  /** Permission flags applied to the new chat member. */
  permissions?: PermissionFlags;
}

export interface DispatchReactionCountOptions {
  /** Override the `date` timestamp of the reaction count update. */
  date?: number;
}
