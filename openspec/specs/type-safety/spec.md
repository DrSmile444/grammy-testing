# type-safety Specification

## Purpose

Ensure that types shared with grammy are imported from grammy rather than duplicated locally, and that exhaustive compile-time guards prevent the codebase from silently drifting when grammy adds new variants.

## Requirements

### Requirement: `assertNever` enforces exhaustive switches at compile time

The system SHALL provide an `assertNever(x: never): never` function that is called in the `default` branch of exhaustive switches. Its presence SHALL cause a TypeScript compile error whenever the switch is not exhaustive — i.e., whenever the `never` narrowing cannot be proved. At runtime it SHALL throw an `Error` describing the unexpected value.

#### Scenario: Adding a new ChatMemberStatus breaks the build

- **WHEN** grammy introduces a new `ChatMember` variant (e.g. `'subscriber'`) that extends `ChatMemberStatus`
- **THEN** `makeChatMember` in `dispatch.ts` fails to compile because `status` is no longer narrowed to `never` at the `assertNever` call site
- **AND** the developer is forced to add an explicit `case` before the build succeeds

#### Scenario: Runtime path is unreachable under normal operation

- **WHEN** `makeChatMember` is called with a valid `ChatMemberStatus` value
- **THEN** the function returns a correctly-typed `ChatMember` without reaching the `assertNever` branch

### Requirement: `MEDIA_FIELDS` is an exhaustive compile-time-checked enumeration

The system SHALL define `MEDIA_FIELDS` via an intermediate `Record<MediaType, true>` object so that every member of `MediaType` MUST be listed. Omitting any member SHALL be a TypeScript compile error. The runtime array used for iteration SHALL be derived from `Object.keys` of the exhaustive record.

#### Scenario: Adding a new MediaType member breaks the build

- **WHEN** a new member (e.g. `'contact_media'`) is added to the `MediaType` union
- **THEN** the `Record<MediaType, true>` assignment in `reply.ts` fails to compile until the new key is added to the record
- **AND** the developer is forced to decide whether `deriveMedia` should handle the new type

#### Scenario: Existing media types are still detected correctly

- **WHEN** a bot sends a photo reply and the test calls `reply.media`
- **THEN** `reply.media.type` equals `'photo'`
- **AND** `reply.media.fileId` equals the file ID from the captured payload

### Requirement: `MESSAGE_METHODS` entries are validated against grammy's `RawApi` at compile time

The set of API method names that trigger `Reply` derivation SHALL be defined as a `satisfies Partial<Record<keyof RawApi, true>>` guard. This ensures every entry is a real grammy method name — typos and stale names are compile errors. The list is intentionally a curated subset (not all grammy methods that return `Message`); new methods may be added as the library grows.

#### Scenario: Misspelled method name breaks the build

- **WHEN** a developer adds `'sendMesage'` (typo) to `MESSAGE_METHODS_GUARD`
- **THEN** the `satisfies Partial<Record<keyof RawApi, true>>` constraint fails to compile
- **AND** the developer must correct the spelling before the build succeeds

#### Scenario: Grammy-renamed method breaks the build

- **WHEN** grammy renames an API method that is listed in `MESSAGE_METHODS_GUARD`
- **THEN** the build fails at the `satisfies` constraint
- **AND** the developer is prompted to update or remove the stale entry

### Requirement: Dead code is absent from the production source

The system SHALL NOT export or reference `Union` type or `unionMap` constant. These were accidentally committed as a demonstrative example and have no runtime role.

#### Scenario: No Union export in the public surface

- **WHEN** a consumer imports from the package root
- **THEN** `Union` and `unionMap` are not available as named exports
