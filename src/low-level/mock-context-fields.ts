import type { Context } from 'grammy';

import { mockContextField, type MockContextFieldReturnType } from './mock-context-field';

/**
 * grammY contexts that have been augmented with the `session` flavor.
 * Match this shape if you use `session()` middleware from grammY.
 */
export interface SessionContext<TSession> extends Context {
  session: TSession;
}

export interface ChatSessionContext<TChatSession> extends Context {
  chatSession: TChatSession;
}

export interface StateContext<TState> extends Context {
  state: TState;
}

/**
 * Mock the `ctx.session` field with a partial value. Returns the
 * (mutable) mocked value plus the middleware that injects it.
 * @param partial - Partial session value.
 * @returns `{ session, mockSessionMiddleware }`.
 */
export const mockSession = <TSession, TContext extends SessionContext<TSession>>(partial: Partial<TSession>) =>
  mockContextField<
    TContext,
    'session',
    {
      session: TContext['session'];
      mockSessionMiddleware: MockContextFieldReturnType<TContext, 'session'>['middleware'];
    }
  >('session', ({ mocked, middleware }) => ({
    session: mocked,
    mockSessionMiddleware: middleware,
  }))(partial as never);

export const mockChatSession = <TChatSession, TContext extends ChatSessionContext<TChatSession>>(partial: Partial<TChatSession>) =>
  mockContextField<
    TContext,
    'chatSession',
    {
      chatSession: TContext['chatSession'];
      mockChatSessionMiddleware: MockContextFieldReturnType<TContext, 'chatSession'>['middleware'];
    }
  >('chatSession', ({ mocked, middleware }) => ({
    chatSession: mocked,
    mockChatSessionMiddleware: middleware,
  }))(partial as never);

export const mockState = <TState, TContext extends StateContext<TState>>(partial: Partial<TState>) =>
  mockContextField<
    TContext,
    'state',
    {
      state: TContext['state'];
      mockStateMiddleware: MockContextFieldReturnType<TContext, 'state'>['middleware'];
    }
  >('state', ({ mocked, middleware }) => ({
    state: mocked,
    mockStateMiddleware: middleware,
  }))(partial as never);
