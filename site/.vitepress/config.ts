import { defineConfig } from 'vitepress';

import { version } from '../../package.json';

function resolveBase(): string {
  if (!process.env.GITHUB_ACTIONS) {
    return '/';
  }

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];

  return repo ? `/${repo}/` : '/';
}

const base = resolveBase();

export default defineConfig({
  base,
  title: 'grammY Testing',
  description: 'Production-grade testing infrastructure for grammY bots. Drive your bot in-process, capture every API call, assert on replies.',
  lastUpdated: true,
  cleanUrls: true,

  head: [['link', { rel: 'icon', href: `${base}logo.svg` }]],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'grammY Testing',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'High-Level API', link: '/high-level/overview' },
      { text: 'Low-Level API', link: '/low-level/overview' },
      {
        text: `v${version}`,
        items: [
          { text: `v${version} (current)`, link: '/' },
          { text: 'Changelog', link: '/reference/changelog' },
          { text: 'Release Notes', link: 'https://github.com/DrSmile444/grammy-testing/releases' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'How It Works', link: '/guide/how-it-works' },
          { text: 'With Vitest', link: '/guide/with-vitest' },
          { text: 'With Jest', link: '/guide/with-jest' },
          { text: 'With Deno', link: '/guide/with-deno' },
        ],
      },
      {
        text: 'High-Level API',
        items: [
          { text: 'Overview', link: '/high-level/overview' },
          { text: 'Chats', link: '/high-level/chats' },
          { text: 'User', link: '/high-level/user' },
          { text: 'Group & Supergroup', link: '/high-level/groups' },
          { text: 'Channel', link: '/high-level/channels' },
          { text: 'PrivateChat', link: '/high-level/private-chat' },
          { text: 'BusinessAccount', link: '/high-level/business-account' },
          { text: 'Reply', link: '/high-level/reply' },
          { text: 'Logs', link: '/high-level/logs' },
          { text: 'Bot API 10 Features', link: '/high-level/bot-api-10' },
        ],
      },
      {
        text: 'Low-Level API',
        items: [
          { text: 'Overview', link: '/low-level/overview' },
          { text: 'Outgoing Requests', link: '/low-level/outgoing-requests' },
          { text: 'Session Mocking', link: '/low-level/session-mocking' },
          { text: 'Update Builders', link: '/low-level/update-builders' },
          { text: 'Response Mocking', link: '/low-level/response-mocking' },
        ],
      },
      {
        text: 'Recipes',
        items: [
          { text: 'Sessions & State', link: '/recipes/sessions-and-state' },
          { text: 'Keyboards & Buttons', link: '/recipes/keyboards-and-buttons' },
          { text: 'Error Simulation', link: '/recipes/error-simulation' },
          { text: 'Multi-Chat Scenarios', link: '/recipes/multi-chat-scenarios' },
          { text: 'Fire & Forget', link: '/recipes/fire-and-forget' },
        ],
      },
      {
        text: 'Plugins',
        items: [
          { text: 'Conversations', link: '/plugins/conversations-plugin' },
          { text: 'Menu', link: '/plugins/menu-plugin' },
          { text: 'Chat Members', link: '/plugins/chat-members' },
          { text: 'Media Groups', link: '/plugins/media-groups' },
          { text: 'Files', link: '/plugins/files' },
          { text: 'Hydrate', link: '/plugins/hydrate' },
          { text: 'Auto-Retry', link: '/plugins/auto-retry' },
          { text: 'Transformer Throttler', link: '/plugins/transformer-throttler' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'prepareBot', link: '/api/prepare-bot' },
          { text: 'prepareComposer', link: '/api/prepare-composer' },
          { text: 'prepareMiddleware', link: '/api/prepare-middleware' },
          { text: 'Chats', link: '/api/chats' },
          { text: 'User', link: '/api/user' },
          { text: 'Group', link: '/api/group' },
          { text: 'Supergroup', link: '/api/supergroup' },
          { text: 'Channel', link: '/api/channel' },
          { text: 'PrivateChat', link: '/api/private-chat' },
          { text: 'BusinessAccount', link: '/api/business-account' },
          { text: 'OutgoingRequests', link: '/api/outgoing-requests' },
          { text: 'Reply', link: '/api/reply' },
          { text: 'Logs', link: '/api/logs' },
          { text: 'Types', link: '/api/types' },
        ],
      },
      {
        text: 'Reference',
        items: [{ text: 'Changelog', link: '/reference/changelog' }],
      },
    ],

    search: { provider: 'local' },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/DrSmile444/grammy-testing',
      },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/@grammyjs/testing',
      },
    ],

    editLink: {
      pattern: 'https://github.com/DrSmile444/grammy-testing/edit/main/site/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-Present Dmytro Vakulenko',
    },
  },
});
