# Introduction

`grammy-testing` is a testing framework for [grammY](https://grammy.dev)-based Telegram bots.
Instead of sending live messages to Telegram, it runs your bot **entirely in-process**: a
transformer intercepts every outgoing API call, synthetic updates drive your handlers, and you
inspect what the bot sent without touching a network.

## The problem it solves

Testing a Telegram bot the naive way means:

- Keeping a test token active and a live bot running
- Sending real messages and waiting for replies over the network
- Dealing with rate limits, network flakiness, and Telegram's occasional downtime
- Cleaning up state left in Telegram after tests

Every test becomes an integration test against external infrastructure, which is slow, brittle,
and impossible to run offline.

## How grammY Testing solves it

```
┌─────────────────────────────────────────────────────────┐
│                       Your test                         │
│                                                         │
│   user.sendText('hello')  →  bot handles update         │
│                               ↓                         │
│                          Transformer intercepts         │
│                          ctx.reply('Hi!')               │
│                               ↓                         │
│   user.replies.lastOrThrow()  ←  Reply captured         │
└─────────────────────────────────────────────────────────┘
```

1. `prepareBot` installs a **transformer** on your bot's API client that intercepts every
   outgoing call (e.g. `sendMessage`, `editMessageText`, `deleteMessage`).
2. You **dispatch synthetic updates** (text messages, commands, callbacks, polls, etc.) using
   high-level actor objects (`User`, `Group`, `Channel`).
3. Your bot's middleware runs exactly as in production — the same handlers, the same context,
   the same grammY internals.
4. Captured calls are stored in **per-user and per-chat logs** (`replies`, `messages`, `edits`,
   `deletions`) ready to assert on.

No mocking of grammY internals. No monkey-patching. Your handlers run real code.

## Relationship to grammY

grammY Testing is an **official** grammY ecosystem package (`grammy-testing`). It depends on
`grammy` as a peer dependency and tracks grammY's API surface. Any grammY bot — with or without
plugins — can be tested with this library.

## What's next

- [Getting Started](/guide/getting-started) — install and write your first test in five minutes
- [How It Works](/guide/how-it-works) — deep dive into the transformer and idle tracking
- [High-Level API Overview](/high-level/overview) — the `Chats`, `User`, and chat actor APIs
