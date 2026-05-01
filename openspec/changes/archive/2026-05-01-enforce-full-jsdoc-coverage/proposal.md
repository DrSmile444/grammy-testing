## Why

The `eslint-compliance` spec requires every exported function, class, and non-trivial internal function to have a JSDoc comment, but `jsdoc/require-jsdoc` currently only enforces `FunctionDeclaration` (the default). Class methods, constructors, arrow functions, and function expressions are silently exempt — meaning ~121 violations exist in `src/` with no lint signal.

## What Changes

- Configure `jsdoc/require-jsdoc` in `.eslint/node/jsdoc.eslint.mjs` to enable `MethodDefinition`, `ClassDeclaration`, `ArrowFunctionExpression`, and `FunctionExpression` enforcement.
- Write JSDoc comments for all ~121 currently-uncovered locations in `src/`.
- `npm run lint` must exit 0 after both changes land.

## Capabilities

### New Capabilities

_(none — this change enforces an existing spec requirement, not a new capability)_

### Modified Capabilities

- `eslint-compliance`: Strengthens the JSDoc enforcement rule to match the existing "every exported function and class has JSDoc" requirement. No new scenarios added; existing scenarios now have a mechanical enforcement mechanism rather than relying on convention.

## Impact

- **`.eslint/node/jsdoc.eslint.mjs`**: `require-jsdoc` rule gains explicit `require` sub-options.
- **`src/**/*.ts`**: ~121 methods, constructors, and arrow functions need JSDoc added.
- No public API changes, no breaking changes, no dependency changes.
