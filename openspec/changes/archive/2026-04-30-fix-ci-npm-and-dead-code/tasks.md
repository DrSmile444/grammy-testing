## 1. Dead code — remove pollStateCounter

- [x] 1.1 Delete `private pollStateCounter = 0` declaration from `Chats` (`src/high-level/chats.ts`)
- [x] 1.2 Delete `this.pollStateCounter += 1` increment in `dispatchPollState` (`src/high-level/chats.ts`)

## 2. IdGenerator — add nextMessageId()

- [x] 2.1 Add `private messageCounter = 1` field to `IdGenerator` (`src/high-level/id-generator.ts`)
- [x] 2.2 Implement `nextMessageId(): number` method (same pattern as `nextUpdateId`)

## 3. Channel — use nextMessageId for default message ID

- [x] 3.1 Replace `const updateId = this.ids.nextUpdateId(); const messageId = options.messageId ?? updateId` with `const messageId = options.messageId ?? this.ids.nextMessageId()` in `Channel.postMessageTo` (`src/high-level/channel.ts`)
- [x] 3.2 Keep `update_id: this.ids.nextUpdateId()` as a separate call for the update ID

## 4. Corepack — pin npm version

- [x] 4.1 Add `"packageManager": "npm@11.9.0"` to `package.json`
- [x] 4.2 Run `npm install` to regenerate `package-lock.json` with npm 11.9.0 (corepack will activate it)
- [x] 4.3 Add `- run: corepack enable` step before `- run: npm ci` in the `test` job in `.github/workflows/ci.yml`
- [x] 4.4 Add `- run: corepack enable` step before `- run: npm ci` in the `build-and-verify` job

## 5. Verify

- [x] 5.1 Run `npm run typecheck` — no errors
- [x] 5.2 Run `npm run test:run` — all tests pass
- [x] 5.3 Confirm `npm ci` succeeds locally on a clean `node_modules` (simulates CI behavior)
