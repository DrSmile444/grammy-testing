# Chats (API Reference)

Complete reference for the `Chats<TContext>` class. See [Chats guide](/high-level/chats) for
narrative documentation.

## Constructor (internal)

`Chats` is never instantiated directly. It is created and returned by the prepare functions.

## Type parameter

```ts
class Chats<TContext extends Context = Context>
```

## Actor factories

| Method               | Signature                                                   | Returns                                |
| -------------------- | ----------------------------------------------------------- | -------------------------------------- |
| `newUser`            | `(profile?: UserProfile) => User<TContext>`                 | New `User` actor                       |
| `newAdmin`           | `(profile?: UserProfile) => User<TContext>`                 | User promoted to admin in defaultGroup |
| `newOwner`           | `(profile?: UserProfile) => User<TContext>`                 | User set as creator in defaultGroup    |
| `newGroup`           | `(profile?: string \| ChatProfile) => Group<TContext>`      | New `Group` actor                      |
| `newSupergroup`      | `(profile?: string \| ChatProfile) => Supergroup<TContext>` | New `Supergroup` actor                 |
| `newChannel`         | `(profile?: string \| ChatProfile) => Channel<TContext>`    | New `Channel` actor                    |
| `newPrivateChat`     | `(user: User<TContext>) => PrivateChat<TContext>`           | New `PrivateChat` for user             |
| `newBusinessAccount` | `() => BusinessAccount<TContext>`                           | New `BusinessAccount` actor            |

## Log accessors

| Method         | Signature                                             | Returns                             |
| -------------- | ----------------------------------------------------- | ----------------------------------- |
| `repliesFor`   | `(user: User<TContext>) => RepliesInbox<TContext>`    | Bot replies to that user            |
| `actionsFor`   | `(user: User<TContext>) => ActionsLog`                | `sendChatAction` calls to that user |
| `editsFor`     | `(user: User<TContext>) => EditsLog`                  | `editMessage*` calls to that user   |
| `deletionsFor` | `(chat: AnyChat<TContext>) => DeletionsLog<TContext>` | `deleteMessage` calls in that chat  |

## Properties

| Property       | Type                   | Description                                      |
| -------------- | ---------------------- | ------------------------------------------------ |
| `outgoing`     | `OutgoingRequests`     | All captured API calls                           |
| `defaultGroup` | `Supergroup<TContext>` | Auto-created group used by `newAdmin`/`newOwner` |
| `allUsers`     | `User<TContext>[]`     | All created user actors                          |
| `allChats`     | `AnyChat<TContext>[]`  | All created chat actors                          |

## Methods

### `idle(): Promise<void>`

Resolves when all in-flight transformer promises have settled.

### `clear(): void`

Resets all logs. Does not remove actors or membership state.

### `attachBot(bot): void` (internal)

Called by `prepareBot` to wire the bot reference into all chat actors.

### `deriveFromCapture(request): void` (internal)

Called by the transformer's `onCapture` hook to route a captured API call to the right logs.

### `buildDefaultResponses(): Responses` (internal)

Constructs the default canned response map used when no override is provided.
