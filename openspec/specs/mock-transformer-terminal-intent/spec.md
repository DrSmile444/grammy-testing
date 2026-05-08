# mock-transformer-terminal-intent Specification

## Purpose

Enforces the invariant that the library's mock transformer never forwards API calls to the real Telegram API chain. The invariant is expressed at the type level via `TerminalTransformer`, making it compiler-checked rather than prose-only.

## Requirements

### Requirement: `_previous` in `createTransformer` is enforced as intentionally unused via the type system

The `createTransformer` function in `src/low-level/transformer.ts` SHALL return a `TerminalTransformer` — an internal type whose signature omits `_previous` entirely. The `_previous` parameter SHALL NOT appear in `createTransformer`'s return function signature. An `asTransformer` adapter in `src/low-level/prepare-bot.ts` SHALL convert `TerminalTransformer` to grammY's `Transformer` type for use with `bot.api.config.use()`. The prose comment previously placed on `_previous` SHALL be absent; the type structure is the sole expression of the terminal invariant.

#### Scenario: Code reviewer can understand the invariant without reading prepareBot

- **WHEN** a developer reads `createTransformer` in isolation
- **THEN** `_previous` does not appear in the returned function's parameter list
- **AND** the developer cannot accidentally write a code path that calls it within `createTransformer`
- **AND** the `asTransformer` adapter in `prepare-bot.ts` makes the structural discard of `_previous` explicit and self-documenting at the call site

#### Scenario: Attempted call to `_previous` inside createTransformer is a compile error

- **WHEN** a developer modifies `createTransformer` to add a parameter named `_previous` and calls it
- **THEN** the TypeScript compiler emits a type error because `TerminalTransformer` does not include that parameter
- **AND** no silent regression can occur without a visible compiler failure
