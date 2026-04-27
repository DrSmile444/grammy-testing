import type { GrammyError } from 'grammy';

import type { GrammyErrorSpec } from './grammy-error';
import type { Methods, Payload } from './grammy-types';

/**
 * A captured outgoing API call. Mirrors what grammY's transformer hooks
 * receive: the method name, payload, and (optional) abort signal.
 */
export interface Request<TMethod extends Methods = Methods> {
  method: TMethod;
  payload: Payload<TMethod>;
  signal?: AbortSignal;
}

export type RealApiMethodKeys = Methods;

/**
 * Internal: per-call override stored by `failNext` / `respondNext`.
 * @internal
 */
type OneShotOverride = { kind: 'fail'; error: GrammyError | GrammyErrorSpec } | { kind: 'respond'; payload: unknown };

/**
 * Collects every outgoing API call captured by the testing transformer
 * and exposes typed accessors plus an error-simulation API.
 *
 * Reachable as `chats.outgoing` from any of the entry points
 * ({@link prepareBot}, {@link prepareComposer}, {@link prepareMiddleware}).
 */
export class OutgoingRequests<TMethod extends RealApiMethodKeys = RealApiMethodKeys> {
  /**
   * Captured requests, in capture order. Mutate via `push` / `clear`
   * rather than reassigning.
   */
  requests: Request[] = [];

  /**
   * @internal
   * Each method name maps to a FIFO queue of one-shot overrides.
   */
  readonly oneShot = new Map<RealApiMethodKeys, OneShotOverride[]>();

  /**
   * @internal
   */
  readonly stickyFails = new Map<RealApiMethodKeys, GrammyError | GrammyErrorSpec>();

  get length(): number {
    return this.requests.length;
  }

  /**
   * Trivially typed pass-through that lets test code declare an
   * expected-method-sequence with strong autocomplete:
   * `outgoing.buildMethods(['getChat', 'sendMessage'])`.
   * @param methods - Method names in expected order.
   * @returns The same array typed as `T[]`.
   */
  buildMethods<T extends TMethod>(methods: T[]): T[] {
    return methods;
  }

  /**
   * Names of every captured method, in capture order.
   */
  getMethods(): TMethod[] {
    return this.requests.map((request) => request.method as TMethod);
  }

  push(...requests: Request<TMethod>[]): this {
    this.requests.push(...requests);

    return this;
  }

  clear(): this {
    this.requests = [];

    return this;
  }

  getFirst<TApi extends TMethod>(): Request<TApi> | null {
    return (this.requests[0] as Request<TApi>) ?? null;
  }

  getLast<TApi extends TMethod>(): Request<TApi> | null {
    if (this.requests.length === 0) {
      return null;
    }

    return this.requests.at(-1) as Request<TApi>;
  }

  getTwoLast<TApi extends TMethod, TBot extends TMethod>(): [Request<TApi>?, Request<TBot>?] {
    return this.requests.slice(-2) as [Request<TApi>?, Request<TBot>?];
  }

  getThreeLast<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod>(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
  ] {
    return this.requests.slice(-3) as [Request<TApi>?, Request<TBot>?, Request<TContext>?];
  }

  getAll<TApi extends TMethod>(): [Request<TApi>?];

  getAll<TApi extends TMethod, TBot extends TMethod>(): [Request<TApi>?, Request<TBot>?];

  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod>(): [Request<TApi>?, Request<TBot>?, Request<TContext>?];

  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod, TData extends TMethod>(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
    Request<TData>?,
  ];

  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod, TData extends TMethod, TExtra extends TMethod>(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
    Request<TData>?,
    Request<TExtra>?,
  ];

  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
  >(): [Request<TApi>?, Request<TBot>?, Request<TContext>?, Request<TData>?, Request<TExtra>?, Request<TFilter>?];

  getAll() {
    return this.requests as unknown as never;
  }

  /**
   * Force the next call to `method` to reject. After firing once,
   * subsequent calls revert to the canned response (or default).
   * @param method - grammY API method name.
   * @param errorOrSpec - Real {@link GrammyError} or `{ code, description }` sugar.
   */
  failNext<M extends RealApiMethodKeys>(method: M, errorOrSpec: GrammyError | GrammyErrorSpec): this {
    this.enqueueOneShot(method, { kind: 'fail', error: errorOrSpec });

    return this;
  }

  /**
   * Force every call to `method` to reject until {@link clearOverrides}
   * is called.
   * @param method - grammY API method name.
   * @param errorOrSpec - Real {@link GrammyError} or `{ code, description }` sugar.
   */
  failAll<M extends RealApiMethodKeys>(method: M, errorOrSpec: GrammyError | GrammyErrorSpec): this {
    this.stickyFails.set(method, errorOrSpec);

    return this;
  }

  /**
   * Override the next call to `method` to resolve with a custom payload.
   * @param method - grammY API method name.
   * @param payload - Result value to return.
   */
  respondNext<M extends RealApiMethodKeys>(method: M, payload: unknown): this {
    this.enqueueOneShot(method, { kind: 'respond', payload });

    return this;
  }

  /**
   * Drop every per-method override (both one-shot and sticky).
   */
  clearOverrides(): this {
    this.oneShot.clear();
    this.stickyFails.clear();

    return this;
  }

  /**
   * @param method
   * @internal
   */
  consumeOneShot(method: RealApiMethodKeys): OneShotOverride | undefined {
    const queue = this.oneShot.get(method);

    if (!queue || queue.length === 0) {
      return undefined;
    }

    const next = queue.shift();

    if (queue.length === 0) {
      this.oneShot.delete(method);
    }

    return next;
  }

  private enqueueOneShot(method: RealApiMethodKeys, override: OneShotOverride): void {
    const existing = this.oneShot.get(method);

    if (existing) {
      existing.push(override);

      return;
    }

    this.oneShot.set(method, [override]);
  }
}
