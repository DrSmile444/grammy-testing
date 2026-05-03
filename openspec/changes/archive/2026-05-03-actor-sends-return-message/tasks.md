## 1. Update `dispatchTextMessage` to return `Message`

- [x] 1.1 Change return type of `dispatchTextMessage` in `dispatch.ts` from `void` to `Message`
- [x] 1.2 Return the constructed `message` object from `dispatchTextMessage`

## 2. Update text-based send verbs on `User`

- [x] 2.1 Change `sendText` return type to `Promise<Message>` and return the result of `dispatchTextMessage`
- [x] 2.2 Change `sendMessage` (alias) return type to `Promise<Message>`
- [x] 2.3 Change `sendCommand` return type to `Promise<Message>` (delegates to `sendText`, no logic change)
- [x] 2.4 Change `sendForwarded` return type to `Promise<Message>` and return the result of `dispatchTextMessage`

## 3. Update media send verbs on `User`

- [x] 3.1 Change `sendPhoto` return type to `Promise<Message>` and return the local `message` object
- [x] 3.2 Change `sendDocument` return type to `Promise<Message>` and return the local `message` object
- [x] 3.3 Change `sendVideo` return type to `Promise<Message>` and return the local `message` object
- [x] 3.4 Change `sendAudio` return type to `Promise<Message>` and return the local `message` object
- [x] 3.5 Change `sendVoice` return type to `Promise<Message>` and return the local `message` object
- [x] 3.6 Change `sendVideoNote` return type to `Promise<Message>` and return the local `message` object
- [x] 3.7 Change `sendAnimation` return type to `Promise<Message>` and return the local `message` object
- [x] 3.8 Change `sendSticker` return type to `Promise<Message>` and return the local `message` object

## 4. Update remaining message-producing send verbs

- [x] 4.1 Change `sendLocation` return type to `Promise<Message>` and return the local `message` object
- [x] 4.2 Change `sendContact` return type to `Promise<Message>` and return the local `message` object
- [x] 4.3 Change `sendVenue` return type to `Promise<Message>` and return the local `message` object
- [x] 4.4 Change `sendPoll` return type to `Promise<Message>` and return the local `message` object
- [x] 4.5 Change `sendDice` return type to `Promise<Message>` and return the local `message` object
- [x] 4.6 Change `sendWebAppData` return type to `Promise<Message>` and return the local `message` object
- [x] 4.7 Change `sendSuccessfulPayment` return type to `Promise<Message>` and return the local `message` object

## 5. Update `sendMediaGroup`

- [x] 5.1 Change `sendMediaGroup` return type to `Promise<Message[]>`
- [x] 5.2 Collect each constructed `message` object into a local array and return it after the loop

## 6. Tests and docs

- [x] 6.1 Add tests covering the scenarios in `specs/actor-send-return-message/spec.md`
- [x] 6.2 Update CHANGELOG and bump minor version
- [x] 6.3 Mark TODO.md item #26 as resolved (✅)
