# Files Plugin

Testing bots that use [@grammyjs/files](https://grammy.dev/plugins/files) works out of the box
with `grammy-testing` v0.23.0 and later.

## How it works

`@grammyjs/files` installs a transformer via `bot.api.config.use(hydrateFiles(bot.token))`. This
transformer intercepts `getFile` responses and adds `getUrl()` and `download()` methods to the
returned `File` object.

Before v0.23.0, the library's mock transformer was installed _last_ (outermost), meaning it
intercepted calls before `hydrateFiles` could run. The chain fix in v0.23.0 repositions the
library transformer to index 0 (innermost), so `hydrateFiles` runs as an outer wrapper and can
hydrate the synthetic response.

```
Fixed chain (v0.23.0+):
  hydrateFiles → [library mock] → (HTTP never called)
  ↑
  hydrateFiles runs, receives synthetic File object, adds getUrl() / download()
```

## Setup

Install `hydrateFiles` **before** calling `prepareBot`:

```ts
import { hydrateFiles } from '@grammyjs/files';
import { Bot } from 'grammy';
import { prepareBot } from 'grammy-testing';

const bot = new Bot('token');
bot.api.config.use(hydrateFiles(bot.token)); // before prepareBot ✓

const { chats } = await prepareBot(bot);
```

## Default response shape

`prepareBot` provides a realistic default response for `getFile` so tests work without any
custom `responses` override:

```ts
getFile: () => ({
  file_id: 'test_file_id',
  file_unique_id: 'test_file_unique_id',
  file_size: 1024,
  file_path: 'documents/test_file.pdf',
});
```

`hydrateFiles` uses `file_path` to construct the `getUrl()` return value. The default shape is
sufficient for asserting that `file.getUrl()` returns a valid HTTPS URL in tests.

## Example

```ts
import { hydrateFiles } from '@grammyjs/files';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';
import { prepareBot } from 'grammy-testing';

describe('files-bot', () => {
  it('bot can call file.getUrl() on a document', async () => {
    const bot = new Bot('test-token');
    bot.api.config.use(hydrateFiles(bot.token));

    let fileUrl: string | undefined;

    bot.on('message:document', async (ctx) => {
      const file = await ctx.getFile();
      fileUrl = (file as any).getUrl();
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendDocument('some-file-id');

    expect(fileUrl).toMatch(/^https?:\/\//);
  });
});
```

See the full runnable example in [`examples/21-files-bot/`](https://github.com/DrSmile444/grammy-testing/tree/main/examples/21-files-bot).

## Custom response override

If you need a specific `file_path` (e.g., to test a URL pattern), override `getFile` in the
`responses` option:

```ts
const { chats } = await prepareBot(bot, {
  responses: {
    getFile: () => ({
      file_id: 'custom-id',
      file_unique_id: 'custom-unique-id',
      file_size: 2048,
      file_path: 'photos/user_photo.jpg',
    }),
  },
});
```
