import type { RawApi } from 'grammy';

/**
 * Names of every method on grammY's `RawApi`. Equivalent to the
 * `Methods<RawApi>` helper grammY exposes internally.
 */
export type Methods = keyof RawApi;

/**
 * Payload (first argument) for a given grammY API method.
 */
export type Payload<TMethod extends Methods> = Parameters<RawApi[TMethod]>[0] extends undefined
  ? Record<string, never>
  : Parameters<RawApi[TMethod]>[0];

/**
 * Awaited return type for a given grammY API method.
 */
export type Result<TMethod extends Methods> = Awaited<ReturnType<RawApi[TMethod]>>;
