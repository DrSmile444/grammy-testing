// Smoke-verifies that the CJS build exports the expected public symbols.
// Run after `npm run build` via `npm run test:cjs`.
const t = require('../dist/index.cjs');
const ll = require('../dist/low-level.cjs');

const symbols = [t.prepareBot, t.OutgoingRequests, t.mockSession, ll.MessagePrivateMockUpdate];

for (const f of symbols) {
  if (typeof f !== 'function') {
    throw new TypeError(`CJS export missing or not a function: ${String(f)}`);
  }
}

console.log('CJS exports OK');
