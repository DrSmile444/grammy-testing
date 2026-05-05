import type { Methods, Payload, Result } from './grammy-types';

/**
 * Resolver for a single grammY API method's canned response.
 * Either a static value or a function `(payload, method) => result`.
 */
export type ResponseResolver<TMethod extends Methods> =
  | ((payload: Payload<TMethod>, method: TMethod) => Partial<Result<TMethod>> | Promise<Partial<Result<TMethod>>>)
  | Partial<Result<TMethod>>;

/**
 * Map of grammY API method name → canned response resolver.
 * Pass this to {@link prepareBot} via `options.responses`.
 */
export type Responses = {
  [M in Methods]?: ResponseResolver<M>;
};
