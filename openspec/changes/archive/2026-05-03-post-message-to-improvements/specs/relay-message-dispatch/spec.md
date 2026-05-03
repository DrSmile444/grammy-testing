## ADDED Requirements

### Requirement: `channel.postMessageTo` returns the dispatched Message (channel-side counterpart)

`channel.postMessageTo(target, text, options?)` SHALL return `Promise<Message>`, consistent with
`group.postRelayMessage` and all `User` send verbs. This requirement is the channel-side
complement to the `group.postRelayMessage` return-value behaviour already specified in this
capability's main spec.

#### Scenario: postMessageTo return value is usable as reply_to_message for a subsequent sendText

- **WHEN** the test calls `const post = await channel.postMessageTo(group, 'announcement')`
- **AND** then calls `await user.sendText('nice post', { chat: group, reply_to_message: post })`
- **AND** the bot handler reads `ctx.message.reply_to_message`
- **THEN** `reply_to_message.message_id` equals `post.message_id`
