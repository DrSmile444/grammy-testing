# Bot API 10 Features

`grammy-testing` v0.26.0 adds first-class support for the surfaces introduced in grammY 1.43
(Bot API 10.0) and 1.44 (Bot API 10.1). All new outgoing methods are captured in
`chats.outgoing` automatically; the helpers below add ergonomic responses, dispatch verbs, and
read accessors on top of that capture.

> Requires `grammy@^1.44.0`.

## Guest mode

A guest is a user who messages the bot in a chat the bot is not a member of. Dispatch a
`guest_message` with `user.sendGuestMessage(chat, text?)` — it returns the generated
`guest_query_id` so you can correlate the bot's `answerGuestQuery` call.

```ts
const group = chats.newSupergroup();
const guest = chats.newUser();

const queryId = await guest.sendGuestMessage(group, 'is anyone there?');

// The bot replies with ctx.api.answerGuestQuery(queryId, <InlineQueryResult>)
const answer = chats.outgoing.requests.find((r) => r.method === 'answerGuestQuery');
expect(answer?.payload).toMatchObject({ guest_query_id: queryId });
expect(chats.guestQueryUser(queryId)?.id).toBe(guest.id);
```

`answerGuestQuery` is an inline-style answer (it returns a `SentGuestMessage` with an
`inline_message_id`), **not** a chat message — it never appears in `chat.messages`.

## Rich messages

`reply.richMessage` exposes the `InputRichMessage` the bot sent via `sendRichMessage` /
`sendRichMessageDraft`, with a `plainText` convenience that strips the formatting markup.

```ts
bot.on('message:text', async (ctx) => {
  await ctx.api.sendRichMessage(ctx.chat.id, { html: '<b>You said:</b> hi' });
});

const reply = user.replies.lastOrThrow();
expect(reply.richMessage?.html).toBe('<b>You said:</b> hi');
expect(reply.richMessage?.plainText).toBe('You said: hi');
```

## Message drafts (streaming)

`sendMessageDraft` / `sendRichMessageDraft` return `true` and act as ephemeral previews — they do
not produce a `Message`. They are captured in a drafts projection so you can assert a streaming
sequence:

```ts
await user.sendText('go'); // bot streams drafts, then sends the final rich message

expect(user.drafts.length).toBe(3); // or chats.draftsFor(user)
expect(user.drafts.lastOrThrow().payload.text); // the last streamed draft
```

## Reaction removal

`deleteMessageReaction` / `deleteAllMessageReactions` are captured into `chats.reactionRemovals`:

```ts
const removal = chats.reactionRemovals.lastOrThrow();
expect(removal.method).toBe('deleteMessageReaction');
expect(removal.messageId).toBe(targetMessageId);
// deleteAllMessageReactions carries no message_id → removal.messageId is undefined
```

## Join-request queries

`user.requestJoin(group)` now returns the `chat_join_request.query_id`, which the bot answers with
`answerChatJoinRequestQuery`:

```ts
const queryId = await user.requestJoin(group);
// bot calls ctx.api.answerChatJoinRequestQuery(queryId, 'approve')
expect(chats.outgoing.requests.some((r) => r.method === 'answerChatJoinRequestQuery')).toBe(true);
```

## Managed-bot defaults

`getManagedBotAccessSettings`, `setManagedBotAccessSettings`, `getManagedBotToken`,
`replaceManagedBotToken`, and `getUserPersonalChatMessages` resolve with type-correct synthetic
defaults out of the box. Override any of them via the `responses` option to `prepareBot`.
`getChatAdministrators` honors `return_bots: false` by excluding bot administrators from the
auto-derived result.
