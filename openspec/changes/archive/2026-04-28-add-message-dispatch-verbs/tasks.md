## 1. Dispatch layer

- [x] 1.1 Add optional `forwardOrigin?: MessageOrigin` to `PrivateMessageDispatch` interface in `dispatch.ts`
- [x] 1.2 Pass `forward_origin: spec.forwardOrigin` through to the constructed `Message` object in `dispatchTextMessage`
- [x] 1.3 Add `EditedMessageDispatch<TContext>` interface and `dispatchEditedMessage` function in `dispatch.ts`

## 2. User verbs

- [x] 2.1 Add `SendForwardedOptions<TContext>` interface to `user.ts`
- [x] 2.2 Implement `user.sendForwarded(text, options)` delegating to `dispatchTextMessage` with `forwardOrigin`
- [x] 2.3 Implement `user.editMessage(messageId, text, options?)` delegating to `dispatchEditedMessage`

## 3. Public exports

- [x] 3.1 Export `SendForwardedOptions` from `src/index.ts`

## 4. Reference suite

- [x] 4.1 Update `tests/reference/messages.spec.ts` forwarded-messages block: replace `buildOverwrite` escape hatch with `user.sendForwarded`
- [x] 4.2 Update `tests/reference/messages.spec.ts` edited-messages block: replace inline `Update` literal with `user.editMessage`
- [x] 4.3 Remove `import { MessagePrivateMockUpdate } from '../../src/low-level'` from messages.spec.ts (no longer needed)
- [x] 4.4 Remove the two closed rows from `tests/reference/README.md` gap catalog
- [x] 4.5 Update the file-level JSDoc header in messages.spec.ts to reflect the new verbs
