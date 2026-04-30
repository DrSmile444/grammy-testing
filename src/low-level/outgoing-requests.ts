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
  private _requests: Request[] = [];

  /**
   * Captured requests, in capture order. Read-only externally; use `push` / `clear`.
   */
  get requests(): readonly Request[] {
    return this._requests;
  }

  /**
   * Each method name maps to a FIFO queue of one-shot overrides.
   * @internal
   */
  readonly oneShot = new Map<RealApiMethodKeys, OneShotOverride[]>();

  /**
   * @internal
   */
  readonly stickyFails = new Map<RealApiMethodKeys, GrammyError | GrammyErrorSpec>();

  get length(): number {
    return this._requests.length;
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
   * @returns Array of method names in the order they were captured.
   */
  getMethods(): TMethod[] {
    return this._requests.map((request) => request.method as TMethod);
  }

  push(...requests: Request<TMethod>[]): this {
    this._requests.push(...requests);

    return this;
  }

  clear(): this {
    this._requests.length = 0;

    return this;
  }

  getFirst<TApi extends TMethod>(): Request<TApi> | null {
    if (this._requests.length === 0) {
      return null;
    }

    return this._requests[0] as Request<TApi>;
  }

  getLast<TApi extends TMethod>(): Request<TApi> | null {
    if (this._requests.length === 0) {
      return null;
    }

    return this._requests.at(-1) as Request<TApi>;
  }

  getTwoLast<TApi extends TMethod, TBot extends TMethod>(): [Request<TApi>?, Request<TBot>?] {
    return this._requests.slice(-2) as [Request<TApi>?, Request<TBot>?];
  }

  getThreeLast<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod>(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
  ] {
    return this._requests.slice(-3) as [Request<TApi>?, Request<TBot>?, Request<TContext>?];
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

  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
    T7 extends TMethod,
  >(): [Request<TApi>?, Request<TBot>?, Request<TContext>?, Request<TData>?, Request<TExtra>?, Request<TFilter>?, Request<T7>?];

  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
    T7 extends TMethod,
    T8 extends TMethod,
  >(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
    Request<TData>?,
    Request<TExtra>?,
    Request<TFilter>?,
    Request<T7>?,
    Request<T8>?,
  ];

  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
    T7 extends TMethod,
    T8 extends TMethod,
    T9 extends TMethod,
  >(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
    Request<TData>?,
    Request<TExtra>?,
    Request<TFilter>?,
    Request<T7>?,
    Request<T8>?,
    Request<T9>?,
  ];

  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
    T7 extends TMethod,
    T8 extends TMethod,
    T9 extends TMethod,
    T10 extends TMethod,
  >(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
    Request<TData>?,
    Request<TExtra>?,
    Request<TFilter>?,
    Request<T7>?,
    Request<T8>?,
    Request<T9>?,
    Request<T10>?,
  ];

  getAll() {
    return this._requests as unknown as never;
  }

  /**
   * Force the next call to `method` to reject. After firing once,
   * subsequent calls revert to the canned response (or default).
   * @param method - grammY API method name.
   * @param errorOrSpec - Real {@link GrammyError} or `{ code, description }` sugar.
   * @returns `this` for chaining.
   */
  failNext(method: RealApiMethodKeys, errorOrSpec: GrammyError | GrammyErrorSpec): this {
    this.enqueueOneShot(method, { kind: 'fail', error: errorOrSpec });

    return this;
  }

  /**
   * Force every call to `method` to reject until {@link clearOverrides}
   * is called.
   * @param method - grammY API method name.
   * @param errorOrSpec - Real {@link GrammyError} or `{ code, description }` sugar.
   * @returns `this` for chaining.
   */
  failAll(method: RealApiMethodKeys, errorOrSpec: GrammyError | GrammyErrorSpec): this {
    this.stickyFails.set(method, errorOrSpec);

    return this;
  }

  /**
   * Override the next call to `method` to resolve with a custom payload.
   * @param method - grammY API method name.
   * @param payload - Result value to return.
   * @returns `this` for chaining.
   */
  respondNext(method: RealApiMethodKeys, payload: unknown): this {
    this.enqueueOneShot(method, { kind: 'respond', payload });

    return this;
  }

  /**
   * Drop every per-method override (both one-shot and sticky).
   * @returns `this` for chaining.
   */
  clearOverrides(): this {
    this.oneShot.clear();
    this.stickyFails.clear();

    return this;
  }

  /**
   * Dequeues and returns the next one-shot override for `method`, or `undefined` if none.
   * @param method - The API method name to look up.
   * @returns The next queued one-shot override, or `undefined`.
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
