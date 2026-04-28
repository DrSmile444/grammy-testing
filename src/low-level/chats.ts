import type { Context } from 'grammy';

import type { Chats } from '../high-level/chats';

/**
 * Type alias preserved for v0.1 backward compatibility. Every entry
 * point now returns the v0.2 `Chats<TContext>` class which still
 * exposes the v0.1 surface (`outgoing`, `idle`).
 */
export type ChatsHandle<TContext extends Context = Context> = Chats<TContext>;

/** v0.1-era public type alias. Keep exported for users still importing it. */
export type { Chats } from '../high-level/chats';
