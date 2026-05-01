## Context

`jsdoc/require-jsdoc` is set to `"error"` in `.eslint/node/jsdoc.eslint.mjs` via the `flat/recommended-typescript-error` preset. The preset uses the rule's defaults, which only fire on `FunctionDeclaration`. All other constructs (`MethodDefinition`, `ClassDeclaration`, `ArrowFunctionExpression`, `FunctionExpression`) default to `false`.

The codebase is class-heavy — `src/high-level/` is entirely class-based. As a result, 121 methods and constructors are undocumented with no lint signal.

Violation distribution:
```
29  src/high-level/user.ts
20  src/high-level/chats.ts
19  src/low-level/outgoing-requests.ts
 8  src/high-level/id-generator.ts
 6  src/high-level/group.ts
 6  src/high-level/messages-log.ts
 6  src/high-level/supergroup.ts
 4  src/high-level/channel.ts
 3  src/high-level/private-chat.ts
 3  src/high-level/reply.ts
 2  src/low-level/mock-context-fields.ts
 2  src/low-level/updates/*.ts  (× 5 files)
 1  src/low-level/{idle,prepare-bot,mock-context-field,generic-mock.update}.ts
```

## Goals / Non-Goals

**Goals:**
- `jsdoc/require-jsdoc` fires on `MethodDefinition`, `ClassDeclaration`, `ArrowFunctionExpression`, and `FunctionExpression` in addition to the existing `FunctionDeclaration`.
- `npm run lint` exits 0 after all JSDoc is added.
- Every `@param` has a description; every non-void method has `@returns`.

**Non-Goals:**
- Test files (`tests/`) — already exempt via existing config; not changing scope.
- Changing the content quality bar beyond what `jsdoc/require-description` and `jsdoc/require-param-description` already enforce.
- Adding `@example` blocks or `@since` tags.

## Decisions

### D1: Override the `require-jsdoc` rule inline rather than creating a new config block

The existing `jsdoc.eslint.mjs` exports a `defineConfig` with one block per file type. The cleanest fix is to add the `require` sub-option directly to each block's `rules` object, alongside the already-overridden `jsdoc/require-description`.

**Alternative considered**: wrapping the preset differently or using `contexts` instead of `require`. Rejected — `require` is the documented, idiomatic way; `contexts` is for AST selector fine-tuning and would add unnecessary complexity.

### D5: Omit `ArrowFunctionExpression` and `FunctionExpression` from `require`

`ArrowFunctionExpression: true` catches inline callbacks in object literals (e.g. context wiring passed to constructors) in addition to class field arrows. Requiring JSDoc on `(callbackData, byUserId, byChatId) => { ... }` inside a method body adds noise with no IDE-hover value — the surrounding method already provides the context.

`MethodDefinition: true` covers all class methods including constructors. `ClassDeclaration: true` covers class docs. Together these enforce documentation on every genuine API surface. Arrow function class *fields* are rare in this codebase and can be handled manually on a case-by-case basis.

**Alternative considered**: keeping both flags and documenting all 121 violations. Rejected after implementation revealed that 42 of those violations were implementation-level callbacks with no user-facing value.

### D2: No exemptions for private members

All methods get JSDoc, including `private` ones. The spec says "every ... non-trivial internal function" — private methods in public classes are non-trivial by this standard. Consistency beats selectivity: reviewers don't have to judge what's "trivial".

**Alternative considered**: `contexts` selector to exclude `[accessibility="private"]` MethodDefinitions. Rejected — adds config complexity for marginal benefit; private methods in a library that's meant to be understood and extended are worth documenting.

### D3: `checkConstructors: true` (default) — keep it

Constructors often have non-obvious parameter semantics. Keeping default means they're covered.

### D4: `exemptEmptyFunctions: false` (default) — keep it

Empty or no-op methods still benefit from a one-line doc explaining *why* they're empty.

## Risks / Trade-offs

- **[Size]** 121 JSDoc blocks to write in one PR → Mitigation: file-by-file commits; the high-level classes (user, chats, outgoing-requests) account for 68 of them.
- **[Noise in diffs]** Large doc-only diff makes non-doc changes harder to review alongside → Mitigation: land this as a standalone PR with no logic changes.
- **[Staleness]** Docs can drift from implementation → Mitigation: `jsdoc/require-param` and `jsdoc/require-returns` already enforce structural correctness; descriptions are a one-time investment.
