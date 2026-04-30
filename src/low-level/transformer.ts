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

function ok(result: unknown): OkReturn {
  return { ok: true, result };
}

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
    const value = await (resolver as (payload: Payload<TM>, method: TM) => Promise<unknown> | unknown)(payload, method);

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
 * @param options.onCapture
 * @returns A grammY transformer ready for `bot.api.config.use`.
 */
export function createTransformer({ outgoing, idle, responses, onCapture }: TransformerOptions): Transformer {
  return ((_previous: unknown, method: Methods, payload: Payload<Methods>, signal?: AbortSignal) => {
    const request = { method, payload, signal };

    outgoing.push(request);

    if (onCapture) {
      onCapture(request);
    }

    return idle.track(resolveCall(outgoing, responses, method, payload));
  }) as Transformer;
}
