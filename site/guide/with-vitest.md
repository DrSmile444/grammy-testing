# With Vitest

Vitest is the recommended test runner for grammY Testing. The library uses ESM natively and
Vitest handles it without any special configuration.

## Setup

```sh
npm install --save-dev vitest grammy-testing grammy
```

Minimal `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false, // optional: set true to skip importing describe/it/expect
  },
});
```

No transform plugins, no special flags. Vitest's default ESM support handles everything.

## Writing tests

```ts
// bot.spec.ts
import { prepareBot } from 'grammy-testing';
import { describe, expect, it } from 'vitest';

import { createBot } from './bot';

describe('my bot', () => {
  it('replies to /start', async () => {
    const { chats } = await prepareBot(createBot());
    const user = chats.newUser();

    await user.sendCommand('/start');

    expect(user.replies.lastOrThrow().text).toBe('Welcome!');
  });
});
```

## Coverage

Add `@vitest/coverage-v8` and configure a coverage threshold:

```sh
npm install --save-dev @vitest/coverage-v8
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
```

Run:

```sh
npx vitest run --coverage
```

## Global setup

For shared setup (e.g. a common bot factory), use a `setup.ts` file:

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
  },
});
```

## package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```
