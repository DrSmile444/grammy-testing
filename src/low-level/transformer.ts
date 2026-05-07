import type { Transformer } from 'grammy';

import { toGrammyError } from './grammy-error';
import type { Methods, Payload } from './grammy-types';
import type { IdleTracker } from './idle';
import type { OutgoingRequests, Request } from './outgoing-requests';
import type { Responses } from './responses';

interface TransformerOptions {
  outgoing: OutgoingRequests;
  idle: IdleTracker;
  responses?: Responses;
  /**
   * Optional hook invoked synchronously after each request is captured
   * and before its promise is tracked. Used by the v0.2 high-level
   * layer to derive `chat.messages` and `user.replies` projections.
   */
  onCapture?: (request: Request) => void;
}

interface OkReturn {
  ok: true;
  result: unknown;
}

/**
 * Wraps a raw result value into the `{ ok: true, result }` shape grammY expects.
 * @param result - The API result value to wrap.
 * @returns An `OkReturn` envelope.
 */
function ok(result: unknown): OkReturn {
  return { ok: true, result };
}

/**
 * Resolves a single API call against the configured overrides and canned responses.
 * Checks one-shot overrides first, then sticky fails, then the `responses` map,
 * and falls back to `{ ok: true, result: true }`.
 * @param outgoing - The `OutgoingRequests` collector holding active overrides.
 * @param responses - Optional map of canned responses keyed by method name.
 * @param method - The grammY API method being called.
 * @param payload - The request payload for the call.
 * @returns A resolved `OkReturn`, or throws a `GrammyError` if an override demands it.
 */
async function resolveCall<TM extends Methods>(
  outgoing: OutgoingRequests,
  responses: Responses | undefined,
  method: TM,
  payload: Payload<TM>,
): Promise<OkReturn> {
  const oneShot = outgoing.consumeOneShot(method);

  if (oneShot?.kind === 'fail') {
    throw toGrammyError(oneShot.error, method);
  }

  if (oneShot?.kind === 'respond') {
    return ok(oneShot.payload);
  }

  const sticky = outgoing.stickyFails.get(method);

  if (sticky) {
    throw toGrammyError(sticky, method);
  }

  // eslint-disable-next-line security/detect-object-injection -- method is a known grammY API name
  const resolver = responses?.[method];

  if (typeof resolver === 'function') {
    const value = await (resolver as (payload: Payload<TM>, method: TM) => Promise<unknown>)(payload, method);

    return ok(value);
  }

  if (resolver !== undefined) {
    return ok(resolver);
  }

  return ok(true);
}

/**
 * Build a grammY API transformer that captures every outgoing call,
 * applies overrides ({@link OutgoingRequests.failNext} / `failAll` /
 * `respondNext`) or a canned response, tracks the resulting promise
 * via {@link IdleTracker}, and returns it.
 *
 * Defaults to `{ ok: true, result: true }` for any method without
 * override or canned response.
 * @param options - Wired-up collector, idle tracker, and optional canned responses.
 * @param options.outgoing - The {@link OutgoingRequests} collector to push captures into.
 * @param options.idle - The {@link IdleTracker} that wraps every returned promise.
 * @param options.responses - Optional canned-response map.
 * @param options.onCapture - Optional synchronous hook called after each request is captured.
 * @returns A grammY transformer ready for `bot.api.config.use`.
 */
export function createTransformer({ outgoing, idle, responses, onCapture }: TransformerOptions): Transformer {
  // _previous is intentionally never called. This transformer is terminal: it intercepts every
  // API call and returns a synthetic response without forwarding to the real Telegram API.
  // prepareBot reinstalls user transformers above this one; if _previous were called, the inner
  // copy of each user transformer would forward requests to the actual API.
  return ((_previous: unknown, method: Methods, payload: Payload<Methods>, signal?: AbortSignal) => {
    const request = { method, payload, signal };

    outgoing.push(request);

    if (onCapture) {
      onCapture(request);
    }

    return idle.track(resolveCall(outgoing, responses, method, payload));
  }) as Transformer;
}
