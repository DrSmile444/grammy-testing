## Why

The library has no runnable examples, making it hard for newcomers to understand what tests using `@grammyjs/testing` look like in practice. A structured `examples/` folder — referenced from the upcoming README — gives users copy-paste-ready code that progressively covers the full API surface.

## What Changes

- Add `examples/` directory at the repo root with 20 numbered subfolders, each containing `bot.ts` (the bot implementation) and `bot.spec.ts` (the tests).
- All example test files import from `@grammyjs/testing` (the published package name), resolved via the existing vitest alias — so users can copy them verbatim.
- Add `"examples"` to `tsconfig.json` `include` so example bot files are type-checked.
- Example bot files are included in coverage measurement (each is fully exercised by its spec), reinforcing the 80 % thresholds.
- No new runtime dependencies; examples use only `grammy` and `@grammyjs/testing`, both already present.

## Capabilities

### New Capabilities

- `examples-catalog`: The `examples/` folder as a self-contained, testable catalog of 20 graded bot examples — from a minimal echo bot to a multi-actor scenario — each demonstrating a distinct `@grammyjs/testing` API surface.

### Modified Capabilities

- `build-and-publish`: tsconfig.json `include` gains `"examples"` entry, which affects type-checking scope.

## Impact

- **`tsconfig.json`**: add `"examples"` to `include`.
- **`examples/`** (new tree): 20 subfolders × 2 files = 40 new files.
- **Coverage**: `examples/*/bot.ts` files enter the instrumented set; thresholds unchanged.
- **Vitest**: no config change needed — `**/*.spec.ts` already captures `examples/`.
- **ESLint**: no config change needed — `**/*.{js,ts}` already scans `examples/`.
