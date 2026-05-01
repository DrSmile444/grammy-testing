## 1. Fix user.ts Update IDs

- [x] 1.1 Replace `updateId: 600_000` in `user.joinChat` with `this.ctx.ids.nextUpdateId()`
- [x] 1.2 Replace `updateId: 700_000` in `user.leaveChat` with `this.ctx.ids.nextUpdateId()`
- [x] 1.3 Replace `updateId: this.ctx.ids.nextMessageId() + 100_000` in `user.sendText` with `this.ctx.ids.nextUpdateId()`
- [x] 1.4 Replace `updateId: this.ctx.ids.nextMessageId() + 100_000` in `user.sendForwarded` with `this.ctx.ids.nextUpdateId()`
- [x] 1.5 Replace `updateId: this.ctx.ids.nextMessageId() + 500_000` in `user.editMessage` with `this.ctx.ids.nextUpdateId()`

## 2. Verify Tests Pass

- [x] 2.1 Run `npm run test:run` and confirm all 220+ tests still pass
- [x] 2.2 Run `npm run typecheck` and confirm no type errors
