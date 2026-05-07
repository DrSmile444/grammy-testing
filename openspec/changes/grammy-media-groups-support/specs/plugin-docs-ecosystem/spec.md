## ADDED Requirements

### Requirement: Plugin documentation page for grammy-media-groups

The system SHALL have a VitePress page at `site/plugins/media-groups.md` documenting how to test bots that use `grammy-media-groups`. The page SHALL cover:

- The install pattern (`bot.api.config.use(mediaGroupTransformer(adapter))`)
- Why the synthetic `sendMediaGroup` response now includes `chat` and `media_group_id`
- How to assert on adapter state in tests
- The distinction between the transformer path and the middleware path (`bot.use(mediaGroups())`)

#### Scenario: media-groups.md exists and is linked in sidebar

- **WHEN** the VitePress site is built
- **THEN** `site/plugins/media-groups.md` is present
- **AND** it appears in the Plugins sidebar group
