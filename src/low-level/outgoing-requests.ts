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
  private readonly requestsStore: Request[] = [];

  /**
   * Captured requests, in capture order. Read-only externally; use `push` / `clear`.
   * @returns Read-only array of captured requests.
   */
  get requests(): readonly Request[] {
    return this.requestsStore;
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

  /**
   * Number of captured requests in the store.
   * @returns The count of captured requests.
   */
  get length(): number {
    return this.requestsStore.length;
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
    return this.requestsStore.map((request) => request.method as TMethod);
  }

  /**
   * Appends one or more captured requests to the store.
   * @param requests - One or more `Request` objects to append.
   * @returns `this` for chaining.
   */
  push(...requests: Request<TMethod>[]): this {
    this.requestsStore.push(...requests);

    return this;
  }

  /**
   * Removes all captured requests from the store.
   * @returns `this` for chaining.
   */
  clear(): this {
    this.requestsStore.length = 0;

    return this;
  }

  /**
   * Returns the first captured request, or `null` if none have been captured.
   * @returns The first `Request`, or `null`.
   */
  getFirst<TApi extends TMethod>(): Request<TApi> | null {
    if (this.requestsStore.length === 0) {
      return null;
    }

    return this.requestsStore[0] as Request<TApi>;
  }

  /**
   * Returns the last captured request, or `null` if none have been captured.
   * @returns The last `Request`, or `null`.
   */
  getLast<TApi extends TMethod>(): Request<TApi> | null {
    if (this.requestsStore.length === 0) {
      return null;
    }

    return this.requestsStore.at(-1) as Request<TApi>;
  }

  /**
   * Returns the last two captured requests as a tuple, oldest first.
   * @returns A two-element tuple of the last two requests (either may be `undefined`).
   */
  getTwoLast<TApi extends TMethod, TBot extends TMethod>(): [Request<TApi>?, Request<TBot>?] {
    return this.requestsStore.slice(-2) as [Request<TApi>?, Request<TBot>?];
  }

  /**
   * Returns the last three captured requests as a tuple, oldest first.
   * @returns A three-element tuple of the last three requests (any may be `undefined`).
   */
  getThreeLast<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod>(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
  ] {
    return this.requestsStore.slice(-3) as [Request<TApi>?, Request<TBot>?, Request<TContext>?];
  }

  /**
   * Returns up to N captured requests as a typed tuple, oldest first.
   * Overloads cover 1–10 arguments; each slot may be `undefined` if fewer requests were captured.
   * @returns A tuple of up to N requests corresponding to the type arguments supplied.
   */
  getAll<TApi extends TMethod>(): [Request<TApi>?];

  /** 2-arg overload of `getAll`. */
  getAll<TApi extends TMethod, TBot extends TMethod>(): [Request<TApi>?, Request<TBot>?];

  /** 3-arg overload of `getAll`. */
  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod>(): [Request<TApi>?, Request<TBot>?, Request<TContext>?];

  /** 4-arg overload of `getAll`. */
  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod, TData extends TMethod>(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
    Request<TData>?,
  ];

  /** 5-arg overload of `getAll`. */
  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod, TData extends TMethod, TExtra extends TMethod>(): [
    Request<TApi>?,
    Request<TBot>?,
    Request<TContext>?,
    Request<TData>?,
    Request<TExtra>?,
  ];

  /** 6-arg overload of `getAll`. */
  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
  >(): [Request<TApi>?, Request<TBot>?, Request<TContext>?, Request<TData>?, Request<TExtra>?, Request<TFilter>?];

  /** 7-arg overload of `getAll`. */
  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
    T7 extends TMethod,
  >(): [Request<TApi>?, Request<TBot>?, Request<TContext>?, Request<TData>?, Request<TExtra>?, Request<TFilter>?, Request<T7>?];

  /** 8-arg overload of `getAll`. */
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

  /** 9-arg overload of `getAll`. */
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

  /** 10-arg overload of `getAll`. */
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

  /**
   * Implementation of `getAll`; returns the full request store cast to the overload type.
   * @returns The full request store cast to the overload tuple type.
   */
  getAll() {
    return this.requestsStore as unknown as never;
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

  /**
   * Pushes `override` onto the FIFO queue for `method`, creating the queue if necessary.
   * @param method - The API method name to queue the override for.
   * @param override - The one-shot override to enqueue.
   */
  private enqueueOneShot(method: RealApiMethodKeys, override: OneShotOverride): void {
    const existing = this.oneShot.get(method);

    if (existing) {
      existing.push(override);

      return;
    }

    this.oneShot.set(method, [override]);
  }
}
