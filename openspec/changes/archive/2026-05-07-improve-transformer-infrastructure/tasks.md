## 1. TerminalTransformer type + asTransformer adapter

- [x] 1.1 In `src/low-level/transformer.ts`, add a `TerminalTransformer` internal type: `(method: Methods, payload: Payload<Methods>, signal?: AbortSignal) => Promise<OkReturn>` (not exported)
- [x] 1.2 Change `createTransformer`'s return type from `Transformer` to `TerminalTransformer` and update the function body to match — remove `_previous` from the returned function's parameter list
- [x] 1.3 Remove the 4-line prose comment that was on `_previous` (the type now enforces the invariant)
- [x] 1.4 In `src/low-level/prepare-bot.ts`, add an `asTransformer` adapter function: `(t: TerminalTransformer): Transformer => ((_prev, method, payload, signal) => t(method, payload, signal)) as Transformer`
- [x] 1.5 Wrap the `createTransformer(...)` call in `prepareBot` with `asTransformer(...)`: `bot.api.config.use(asTransformer(createTransformer({...})))`
- [x] 1.6 Verify TypeScript compiles without error after the change (`npm run typecheck`)

## 2. respondNextRaw on OutgoingRequests

- [x] 2.1 In `src/low-level/outgoing-requests.ts`, add `{ kind: 'respond-raw'; response: unknown }` as a third variant to the `OneShotOverride` union type
- [x] 2.2 In `resolveCall` in `src/low-level/transformer.ts`, add a branch for `kind === 'respond-raw'` that returns `oneShot.response as OkReturn` without wrapping
- [x] 2.3 In `OutgoingRequests`, add the `respondNextRaw(method: RealApiMethodKeys, response: unknown): this` public method that calls `enqueueOneShot(method, { kind: 'respond-raw', response })`

## 3. Auto-retry retry-on-429 test

- [x] 3.1 In `tests/plugins/auto-retry.spec.ts`, add a test: `'autoRetry retries a sendMessage call after a 429 raw response'` — use `respondNextRaw` with `{ ok: false, error_code: 429, description: '...', parameters: { retry_after: 0 } }`, assert two `sendMessage` entries in `chats.outgoing.requests`
- [x] 3.2 Update the file-level JSDoc in `tests/plugins/auto-retry.spec.ts` to document that retry-on-429 is now testable via `respondNextRaw` (replace the limitation note with usage guidance)

## 4. Spec sync

- [x] 4.1 Update `openspec/specs/mock-transformer-terminal-intent/spec.md` — apply the MODIFIED requirement from the change spec (replace comment-based requirement with type-based requirement)
- [x] 4.2 Update `openspec/specs/outgoing-requests-capture/spec.md` — append the `respondNextRaw` ADDED requirement from the change spec
- [x] 4.3 Update `openspec/specs/grammy-plugin-interop/spec.md` — append the auto-retry retry-on-429 ADDED requirement from the change spec

## 5. Changelog and version bump

- [x] 5.1 Add a `## 0.25.0 — <date>` entry to `docs/CHANGELOG.md` covering: `TerminalTransformer` type replaces prose comment, `respondNextRaw` added to `OutgoingRequests`, auto-retry retry-on-429 now testable
- [x] 5.2 Bump version to `0.25.0` in `package.json`
- [x] 5.3 Bump version to `0.25.0` in `jsr.json`

## 6. Quality gate

- [x] 6.1 Run `npm run lint:fix` — fix all errors before proceeding
- [x] 6.2 Run `npm run format:md` — fix all errors before proceeding
- [x] 6.3 Run `npm run typecheck` — fix all errors before proceeding
- [x] 6.4 Run `npm run lint` — fix all errors before proceeding
- [x] 6.5 Run `npm run test:run` — fix all errors before proceeding
- [x] 6.6 Run `npm run test:coverage` — fix all errors before proceeding
