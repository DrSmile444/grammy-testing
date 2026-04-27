import type { IdleTracker } from './idle';
import type { OutgoingRequests } from './outgoing-requests';

/**
 * Test-side handle returned from every entry point. Exposes the
 * captured outgoing requests and an async settle helper.
 */
export interface Chats {
  /**
   * The {@link OutgoingRequests} collector. Inspect captured calls,
   * configure overrides, etc.
   */
  outgoing: OutgoingRequests;

  /**
   * Resolve once every promise returned through the testing
   * transformer has settled. Use this when the bot makes
   * fire-and-forget API calls (`void ctx.api.sendMessage(...)`)
   * that need to settle before assertions run.
   */
  idle: () => Promise<void>;
}

/**
 *
 * @param outgoing
 * @param idle
 */
export function createChats(outgoing: OutgoingRequests, idle: IdleTracker): Chats {
  return {
    outgoing,
    idle: () => idle.idle(),
  };
}
