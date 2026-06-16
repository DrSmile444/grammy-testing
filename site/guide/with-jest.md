# With Jest

grammY Testing is ESM-first. Jest requires extra configuration to handle ESM packages.

## Setup

```sh
npm install --save-dev jest @types/jest ts-jest grammy-testing grammy
```

## ESM configuration

Jest does not support ESM natively. Use `--experimental-vm-modules` and configure Jest to
transform TypeScript with `ts-jest` in ESM mode:

```json
// package.json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest"
  },
  "jest": {
    "preset": "ts-jest/presets/default-esm",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    "transform": {
      "^.+\\.tsx?$": ["ts-jest", { "useESM": true }]
    }
  }
}
```

`tsconfig.json` must target ESM:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

## Writing tests

```ts
// bot.spec.ts
import { prepareBot } from 'grammy-testing';

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

## Known caveats

- `grammy` and `grammy-testing` are ESM-only. If you use CommonJS Jest without
  `--experimental-vm-modules`, tests will fail with `ERR_REQUIRE_ESM`.
- `ts-jest` v29+ with `useESM: true` is required. Older versions may need additional config.
- If you hit issues with `deepmerge` or other ESM-only transitive deps, add them to
  `transformIgnorePatterns`:
  ```json
  "transformIgnorePatterns": ["node_modules/(?!(grammy|@grammyjs|deepmerge)/)"]
  ```

::: tip Consider Vitest
Vitest handles ESM out of the box with zero configuration and is faster than Jest for most
projects. See [With Vitest](/guide/with-vitest).
:::
