import type { Context, MiddlewareFn } from 'grammy';
import type { PartialDeep } from 'type-fest';

export interface MockContextFieldReturnType<TContext extends Context, TField extends keyof TContext> {
  mocked: TContext[TField];
  middleware: MiddlewareFn<TContext>;
}

/**
 * Generic helper that produces a factory which, when called with a
 * partial value, returns whatever shape the consumer wants — typically
 * `{ <fieldName>, <fieldName>Middleware }`. The middleware assigns
 * the mocked value to `ctx[fieldName]` on every dispatch.
 *
 * The mocked value is mutable: tests can change it between dispatches
 * and the next invocation observes the updated state.
 * @param fieldName - Name of the {@link Context} field to mock.
 * @param remap - Function that shapes the `{ mocked, middleware }`
 *   pair into the consumer's preferred return type.
 * @returns A factory `(partial) => TResult`.
 */
export const mockContextField =
  <TContext extends Context, TField extends keyof TContext, TResult>(
    fieldName: TField,
    remap: (value: MockContextFieldReturnType<TContext, TField>) => TResult,
  ) =>
  (mocked: PartialDeep<TContext[TField]>): TResult =>
    remap({
      mocked: mocked as TContext[TField],
      middleware: (context, next) => {
        // eslint-disable-next-line security/detect-object-injection -- fieldName is a typed keyof, not user input
        context[fieldName] = mocked as TContext[TField];

        return next();
      },
    });
