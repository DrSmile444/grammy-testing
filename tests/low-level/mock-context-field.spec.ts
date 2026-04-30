import { Bot, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';

import {
  type ChatSessionContext,
  mockChatSession,
  mockContextField,
  type MockContextFieldReturnType,
  mockSession,
  mockState,
  prepareBot,
  type SessionContext,
  type StateContext,
} from '../../src/index';
import { MessagePrivateMockUpdate } from '../../src/low-level';

describe('mockContextField (generic)', () => {
  it('injects an arbitrary field via middleware', async () => {
    interface ContextMyField {
      foo: string;
    }

    interface TestContext extends Context {
      myField: ContextMyField;
    }
    interface Result {
      myField: TestContext['myField'];
      myFieldMiddleware: MockContextFieldReturnType<TestContext, 'myField'>['middleware'];
    }

    const factory = mockContextField<TestContext, 'myField', Result>('myField', ({ mocked, middleware }) => ({
      myField: mocked,
      myFieldMiddleware: middleware,
    }));

    const { myField, myFieldMiddleware } = factory({ foo: 'bar' });

    const bot = new Bot<TestContext>('test-token');
    let observed: string | undefined;

    bot.use(myFieldMiddleware);

    bot.on('message:text', (context) => {
      observed = context.myField.foo;
    });

    await prepareBot<TestContext>(bot);
    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());

    expect(observed).toBe('bar');
    expect(myField.foo).toBe('bar');
  });

  it('mutating the mocked value affects subsequent dispatches', async () => {
    interface ContextMyField2 {
      count: number;
    }

    interface TestContext extends Context {
      myField: ContextMyField2;
    }
    interface Result {
      myField: TestContext['myField'];
      myFieldMiddleware: MockContextFieldReturnType<TestContext, 'myField'>['middleware'];
    }

    const factory = mockContextField<TestContext, 'myField', Result>('myField', ({ mocked, middleware }) => ({
      myField: mocked,
      myFieldMiddleware: middleware,
    }));

    const { myField, myFieldMiddleware } = factory({ count: 0 });

    const bot = new Bot<TestContext>('test-token');
    const seen: number[] = [];

    bot.use(myFieldMiddleware);

    bot.on('message:text', (context) => {
      seen.push(context.myField.count);
    });

    await prepareBot<TestContext>(bot);

    await bot.handleUpdate(new MessagePrivateMockUpdate('a').build());
    myField.count = 7;
    await bot.handleUpdate(new MessagePrivateMockUpdate('b').build());

    expect(seen).toEqual([0, 7]);
  });
});

describe('mockSession', () => {
  it('injects partial session and reflects mutations', async () => {
    type TestContext = SessionContext<{ language?: string }>;

    const { session, mockSessionMiddleware } = mockSession<{ language?: string }, TestContext>({
      language: 'en',
    });

    const bot = new Bot<TestContext>('test-token');
    let observed: string | undefined;

    bot.use(mockSessionMiddleware);

    bot.on('message:text', (context) => {
      observed = context.session.language;
    });

    await prepareBot<TestContext>(bot);
    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());

    expect(observed).toBe('en');

    session.language = 'uk';
    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());

    expect(observed).toBe('uk');
  });
});

describe('mockChatSession', () => {
  it('injects partial chat session', async () => {
    type TestContext = ChatSessionContext<{ isBotAdmin: boolean }>;

    const { mockChatSessionMiddleware } = mockChatSession<{ isBotAdmin: boolean }, TestContext>({
      isBotAdmin: true,
    });

    const bot = new Bot<TestContext>('test-token');
    let didObserve: boolean | undefined;

    bot.use(mockChatSessionMiddleware);

    bot.on('message:text', (context) => {
      didObserve = context.chatSession.isBotAdmin;
    });

    await prepareBot<TestContext>(bot);
    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());

    expect(didObserve).toBe(true);
  });
});

describe('mockState', () => {
  it('injects partial state', async () => {
    type TestContext = StateContext<{ foo: number }>;

    const { mockStateMiddleware } = mockState<{ foo: number }, TestContext>({ foo: 1 });

    const bot = new Bot<TestContext>('test-token');
    let observed: number | undefined;

    bot.use(mockStateMiddleware);

    bot.on('message:text', (context) => {
      observed = context.state.foo;
    });

    await prepareBot<TestContext>(bot);
    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());

    expect(observed).toBe(1);
  });
});
