import type { Bot, Context } from 'grammy';

import type { Channel } from './channel';
import type { Group } from './group';
import type { PrivateChat } from './private-chat';
import type { Supergroup } from './supergroup';

/**
 * Discriminated union of every chat kind a `Chats` instance can mint.
 */
export type AnyChat<TContext extends Context = Context> =
  | Channel<TContext>
  | Group<TContext>
  | PrivateChat<TContext>
  | Supergroup<TContext>;

/**
 * Internal symbol used by `Chats` to wire up a chat's bot reference
 * after construction. Not part of the public surface.
 */
export const setBotRef = Symbol('setBotRef');

/**
 * Internal mixin/interface every concrete chat class implements.
 */
export interface ChatRefHolder<TContext extends Context = Context> {
  [setBotRef](bot: Bot<TContext>): void;
}
