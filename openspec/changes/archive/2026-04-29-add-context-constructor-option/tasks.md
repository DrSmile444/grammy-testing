## 1. Shared options type

- [x] 1.1 Add `PrepareWithConstructorOptions<TContext extends Context = Context>` interface to `src/low-level/prepare-composer.ts` extending `PrepareOptions` with `ContextConstructor?: new (...args: ConstructorParameters<typeof Context>) => TContext`
- [x] 1.2 Export `PrepareWithConstructorOptions` from `src/index.ts`

## 2. prepareComposer update

- [x] 2.1 Change the options parameter of `prepareComposer` from `PrepareOptions` to `PrepareWithConstructorOptions<TContext>`
- [x] 2.2 Forward `ContextConstructor` when constructing the internal bot: `new Bot<TContext>('test-token', { ContextConstructor: options.ContextConstructor })`

## 3. prepareMiddleware update

- [x] 3.1 Import `PrepareWithConstructorOptions` into `src/low-level/prepare-middleware.ts`
- [x] 3.2 Change the options parameter of `prepareMiddleware` from `PrepareOptions` to `PrepareWithConstructorOptions<TContext>`
- [x] 3.3 Forward `ContextConstructor` when constructing the internal bot

## 4. Tests

- [x] 4.1 Create `tests/reference/context-constructor.spec.ts` covering:
  - Class-based custom context instantiated correctly via `prepareComposer` + `ContextConstructor`
  - Class-based custom context instantiated correctly via `prepareMiddleware` + `ContextConstructor`
  - Omitting `ContextConstructor` preserves existing behavior (no regression)
  - `responses` option still works alongside `ContextConstructor`

## 5. Quality gate

- [x] 5.1 Run `npm run typecheck` — passes
- [x] 5.2 Run `npm run lint` — passes
- [x] 5.3 Run `npm run test:run` — passes
- [x] 5.4 Run `npm run test:coverage` — passes at 80%+

## 6. Versioning

- [x] 6.1 Bump `version` in `package.json` from `0.4.1` to `0.5.0` (minor — backward-compatible new feature)
