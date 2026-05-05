## Context

The ESLint config at `eslint.config.mjs` references a shared `.eslint/` fragment library that enables a comprehensive rule set: JSDoc enforcement, unicorn best practices, naming conventions, TypeScript strictness, and more. During the initial development pass, rather than fixing violations as they were introduced, two blanket override blocks were added. The result is a two-tier system: the config says one thing, the overrides say another, and the linter effectively enforces nothing on the code that matters most.

The violation breakdown (from running lint without overrides):

- **JSDoc**: ~110 violations — missing `@param` descriptions, `@returns`, top-level JSDoc on exported functions
- **Barrel files**: 32 violations — `no-barrel-files` rule applies globally but fires on the library's intentional entry points
- **Unicorn abbreviations**: ~140 violations — almost entirely `ctx`, which is grammy's canonical context variable name
- **Mechanical style**: ~55 violations — `++` operators, template literal string types, use-before-define ordering
- **Naming conventions**: ~40 violations — mix of legitimate fixes and false positives from Telegram's snake_case API fields
- **Test quality**: ~55 violations — non-null assertions, conditional expects, void usage

## Goals / Non-Goals

**Goals:**

- `eslint.config.mjs` has no override blocks suppressing rules
- `npm run lint` exits 0 with zero errors
- Every exported function and non-trivial internal has JSDoc with descriptions, `@param`, and `@returns`
- Test files use proper narrowing instead of `!` non-null assertions
- The unicorn `allowList` reflects the grammy ecosystem vocabulary

**Non-Goals:**

- Adding new features or changing library behavior
- Modifying the shared `.eslint/` config rules themselves (only the allowList and barrel-file ignore)
- Achieving 100% JSDoc coverage on trivial one-liner private functions (the `require-jsdoc` rule already limits scope)

## Decisions

### D1: Fix unicorn abbreviations via allowList, not rule suppression

`ctx` is grammy's canonical name — every example, every plugin, every user writes `ctx`. Renaming to `context` would make the code unreadable to the grammy ecosystem. The correct fix is to add grammy-domain abbreviations to the unicorn `allowList` in `.eslint/node/unicorn.eslint.mjs`:

```
ctx, Ref, params, prop, args, cbData, i (for loop index in tests)
```

Alternatives considered: rename all `ctx` to `context` (rejected — breaks grammy idiom); suppress the rule in source (rejected — that's the current broken state).

### D2: Barrel file rule — ignore entry points only

`no-barrel-files` is designed to prevent barrel files in application code (hurts tree-shaking). A published npm library must have barrel entry points (`src/index.ts`, `src/low-level.ts`). The fix is a targeted file-level ignore for those two files, not disabling the rule globally.

Add to `eslint.config.mjs` as a narrow override:

```js
{ files: ['src/index.ts', 'src/low-level.ts'], rules: { 'no-barrel-files/no-barrel-files': 'off' } }
```

This preserves the rule for all internal files while allowing the public API surface.

### D3: Non-null assertions in tests — replace with explicit narrowing

The pattern `observed!.field` and `chats.repliesFor(user).last!` should become:

```ts
const reply = chats.repliesFor(user).last;
expect(reply).toBeDefined();
if (!reply) return; // or throw — narrows type for subsequent assertions
```

This is strictly better: if the assertion fails, the test fails with a clear message instead of a runtime TypeError. The `if (!value) return` guard is the idiomatic vitest narrowing pattern.

### D4: JSDoc strategy — write meaningful docs, not boilerplate

JSDoc on exported functions should describe what the function/method actually does, not restate the parameter names. The audience is a developer who has installed the library and is reading hover docs in their IDE. Prioritize:

1. Exported classes and their public methods (highest value)
2. Exported functions and types
3. Non-trivial internal functions (where logic isn't obvious from name)

Skip trivial getters and one-liners that are self-documenting.

### D5: `++` operators — replace with `+= 1`

The `no-plusplus` rule prevents `++` and `--`. All module-level counters (e.g., `mcmCounter++`) become `mcmCounter += 1`. Mechanical, safe, no semantic change.

### D6: Template literal expressions — explicit number-to-string

`@typescript-eslint/restrict-template-expressions` disallows non-string types in template literals. Fix: wrap numeric values explicitly: `` `${String(id)}` `` or use `.toString()`. This is strictly safer.

## Risks / Trade-offs

- **JSDoc review burden**: Writing ~110 JSDoc entries is labor-intensive. Incorrect descriptions are worse than none — they mislead users. → Mitigation: focus on behavior descriptions over parameter restatements; review exported surface carefully.

- **Test narrowing verbosity**: The `if (!value) return` pattern adds lines to tests. → Acceptable trade-off: the tests become more explicit about what they expect to be true.

- **`@typescript-eslint/naming-convention` for Telegram fields**: Some violations come from interface properties named after Telegram's API (e.g. `data` in `ReplyClickButtonMatcher`). These are deliberately named to mirror the Telegram `callback_data` field. → Rename to `callbackData` throughout; this is actually an improvement.

## Migration Plan

Incremental: config changes first, then source fixes, then JSDoc, then tests. Each step should leave `npm run lint` getting closer to clean. The change can be implemented as one or several commits — since it's purely quality/documentation, there's no deployment concern.
