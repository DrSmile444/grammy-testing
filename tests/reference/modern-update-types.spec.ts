/**
 * Reference tests for Bot API 7+ update types:
 * message_reaction, poll_answer, chat_join_request, chat_member,
 * edited_channel_post, chat_boost, removed_chat_boost,
 * managed_bot, purchased_paid_media, message_reaction_count, poll state.
 */

import { Bot } from 'grammy';
import type {
  ChatBoostUpdated,
  ChatJoinRequest,
  ChatMemberUpdated,
  ManagedBotUpdated,
  MessageReactionCountUpdated,
  MessageReactionUpdated,
  PaidMediaPurchased,
  Poll,
  PollAnswer,
  Update,
} from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: modern-update-types', () => {
  describe('user.reactTo', () => {
    describe('positive', () => {
      it('dispatches message_reaction with emoji string shorthand', async () => {
        const bot = new Bot('test-token');
        let observed: MessageReactionUpdated | undefined;

        bot.on('message_reaction', (ctx) => {
          observed = ctx.update.message_reaction;
        });

        bot.on('message:text', async (ctx) => {
          await ctx.reply('hi');
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();

        await user.sendText('hello');
        const reply = chats.repliesFor(user).last!;

        await user.reactTo(reply, '👍');

        expect(observed).toBeDefined();
        expect(observed!.new_reaction[0]).toMatchObject({ type: 'emoji', emoji: '👍' });
        expect(observed!.message_id).toBe(reply.messageId);
        expect(observed!.user?.id).toBe(user.id);
      });

      it('dispatches message_reaction with a full ReactionType object', async () => {
        const bot = new Bot('test-token');
        let observed: MessageReactionUpdated | undefined;

        bot.on('message_reaction', (ctx) => {
          observed = ctx.update.message_reaction;
        });

        bot.on('message:text', async (ctx) => {
          await ctx.reply('hi');
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();

        await user.sendText('hello');
        const reply = chats.repliesFor(user).last!;

        await user.reactTo(reply, { type: 'emoji', emoji: '🔥' });

        expect(observed!.new_reaction[0]).toMatchObject({ type: 'emoji', emoji: '🔥' });
        expect(observed!.old_reaction).toEqual([]);
      });
    });
  });

  describe('user.answerPoll', () => {
    describe('positive', () => {
      it('dispatches poll_answer with the selected option indices', async () => {
        const bot = new Bot('test-token');
        let observed: PollAnswer | undefined;

        bot.on('poll_answer', (ctx) => {
          observed = ctx.update.poll_answer;
        });

        bot.on('message:text', async (ctx) => {
          await ctx.replyWithPoll('Pick one', ['A', 'B', 'C']);
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();

        await user.sendText('go');
        const pollReply = chats.repliesFor(user).last!;

        await user.answerPoll(pollReply, [0]);

        expect(observed).toBeDefined();
        expect(observed!.option_ids).toEqual([0]);
        expect(observed!.user?.id).toBe(user.id);
      });
    });

    describe('negative', () => {
      it('throws when the reply does not contain a poll', async () => {
        const bot = new Bot('test-token');

        bot.on('message:text', async (ctx) => {
          await ctx.reply('not a poll');
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();

        await user.sendText('trigger');
        const textReply = chats.repliesFor(user).last!;

        await expect(user.answerPoll(textReply, [0])).rejects.toThrow('poll');
      });
    });
  });

  describe('user.requestJoin', () => {
    describe('positive', () => {
      it('dispatches chat_join_request from the user to the group', async () => {
        const bot = new Bot('test-token');
        let observed: ChatJoinRequest | undefined;

        bot.on('chat_join_request', (ctx) => {
          observed = ctx.update.chat_join_request;
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();
        const group = chats.newGroup();

        await user.requestJoin(group);

        expect(observed).toBeDefined();
        expect(observed!.from.id).toBe(user.id);
        expect(observed!.user_chat_id).toBe(user.id);
      });

      it('dispatches chat_join_request for a supergroup', async () => {
        const bot = new Bot('test-token');
        let observed: Update | undefined;

        bot.on('chat_join_request', (ctx) => {
          observed = ctx.update;
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();
        const sg = chats.newSupergroup();

        await user.requestJoin(sg);

        expect(observed!.chat_join_request!.chat.id).toBe(sg.id);
      });
    });
  });

  describe('group.dispatchMemberUpdate', () => {
    describe('positive', () => {
      it('dispatches chat_member when an admin promotes a user', async () => {
        const bot = new Bot('test-token');
        let observed: ChatMemberUpdated | undefined;

        bot.on('chat_member', (ctx) => {
          observed = ctx.update.chat_member;
        });

        const { chats } = await prepareBot(bot);
        const admin = chats.newUser();
        const target = chats.newUser();
        const group = chats.newGroup();

        await group.dispatchMemberUpdate(admin, target, 'administrator');

        expect(observed).toBeDefined();
        expect(observed!.from.id).toBe(admin.id);
        expect(observed!.new_chat_member.status).toBe('administrator');
        expect(observed!.old_chat_member.status).toBe('member');
        expect(observed!.chat.id).toBe(group.id);
      });

      it('respects options.oldStatus override', async () => {
        const bot = new Bot('test-token');
        let observed: ChatMemberUpdated | undefined;

        bot.on('chat_member', (ctx) => {
          observed = ctx.update.chat_member;
        });

        const { chats } = await prepareBot(bot);
        const admin = chats.newUser();
        const target = chats.newUser();
        const sg = chats.newSupergroup();

        await sg.dispatchMemberUpdate(admin, target, 'kicked', { oldStatus: 'restricted' });

        expect(observed!.old_chat_member.status).toBe('restricted');
        expect(observed!.new_chat_member.status).toBe('kicked');
      });
    });
  });

  describe('channel.editPost', () => {
    describe('positive', () => {
      it('dispatches edited_channel_post with the new text', async () => {
        const bot = new Bot('test-token');
        let observedText: string | undefined;
        let observedChatId: number | undefined;
        let observedMessageId: number | undefined;

        bot.on('edited_channel_post', (ctx) => {
          observedText = ctx.update.edited_channel_post?.text;
          observedChatId = ctx.update.edited_channel_post?.chat.id;
          observedMessageId = ctx.update.edited_channel_post?.message_id;
        });

        const { chats } = await prepareBot(bot);
        const channel = chats.newChannel();

        await channel.editPost(42, 'updated text');

        expect(observedText).toBe('updated text');
        expect(observedChatId).toBe(channel.id);
        expect(observedMessageId).toBe(42);
      });
    });
  });

  describe('user.boostChat', () => {
    describe('positive', () => {
      it('dispatches chat_boost and returns a non-empty boost_id', async () => {
        const bot = new Bot('test-token');
        let observed: ChatBoostUpdated | undefined;

        bot.on('chat_boost', (ctx) => {
          observed = ctx.update.chat_boost;
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();
        const group = chats.newGroup();

        const boostId = await user.boostChat(group);

        expect(typeof boostId).toBe('string');
        expect(boostId.length).toBeGreaterThan(0);
        expect(observed!.boost.source.user?.id).toBe(user.id);
        expect(observed!.chat.id).toBe(group.id);
        expect(observed!.boost.boost_id).toBe(boostId);
      });
    });
  });

  describe('user.removeBoost', () => {
    describe('positive', () => {
      it('dispatches removed_chat_boost with the correct boost_id and chat', async () => {
        const bot = new Bot('test-token');
        let observedBoostId: string | undefined;
        let observedChatId: number | undefined;

        bot.on('removed_chat_boost', (ctx) => {
          observedBoostId = ctx.update.removed_chat_boost?.boost_id;
          observedChatId = ctx.update.removed_chat_boost?.chat.id;
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();
        const group = chats.newGroup();

        const boostId = await user.boostChat(group);
        await user.removeBoost(group, boostId);

        expect(observedBoostId).toBe(boostId);
        expect(observedChatId).toBe(group.id);
      });
    });
  });

  describe('user.manageBot', () => {
    describe('positive', () => {
      it('dispatches managed_bot with user as owner and bot.is_bot true', async () => {
        const bot = new Bot('test-token');
        let observed: ManagedBotUpdated | undefined;

        bot.on('managed_bot', (ctx) => {
          observed = ctx.update.managed_bot;
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();

        await user.manageBot({ id: 99_999, first_name: 'MyBot' });

        expect(observed).toBeDefined();
        expect(observed!.user.id).toBe(user.id);
        expect(observed!.bot.id).toBe(99_999);
        expect(observed!.bot.is_bot).toBe(true);
      });
    });
  });

  describe('user.purchasePaidMedia', () => {
    describe('positive', () => {
      it('dispatches purchased_paid_media with the payload and from user', async () => {
        const bot = new Bot('test-token');
        let observed: PaidMediaPurchased | undefined;

        bot.on('purchased_paid_media', (ctx) => {
          observed = ctx.update.purchased_paid_media;
        });

        const { chats } = await prepareBot(bot);
        const user = chats.newUser();

        await user.purchasePaidMedia('payload-token-abc');

        expect(observed).toBeDefined();
        expect(observed!.paid_media_payload).toBe('payload-token-abc');
        expect(observed!.from.id).toBe(user.id);
      });
    });
  });

  describe('group.dispatchReactionCount', () => {
    describe('positive', () => {
      it('dispatches message_reaction_count with the supplied reactions', async () => {
        const bot = new Bot('test-token');
        let observed: MessageReactionCountUpdated | undefined;

        bot.on('message_reaction_count', (ctx) => {
          observed = ctx.update.message_reaction_count;
        });

        const { chats } = await prepareBot(bot);
        const group = chats.newGroup();

        await group.dispatchReactionCount(100, [{ type: { type: 'emoji', emoji: '👍' }, total_count: 5 }]);

        expect(observed).toBeDefined();
        expect(observed!.message_id).toBe(100);
        expect(observed!.chat.id).toBe(group.id);
        expect(observed!.reactions[0].total_count).toBe(5);
      });
    });
  });

  describe('channel.dispatchReactionCount', () => {
    describe('positive', () => {
      it('dispatches message_reaction_count with the correct chat and reactions', async () => {
        const bot = new Bot('test-token');
        let observed: MessageReactionCountUpdated | undefined;

        bot.on('message_reaction_count', (ctx) => {
          observed = ctx.update.message_reaction_count;
        });

        const { chats } = await prepareBot(bot);
        const channel = chats.newChannel();

        await channel.dispatchReactionCount(200, [{ type: { type: 'emoji', emoji: '🔥' }, total_count: 12 }]);

        expect(observed!.chat.id).toBe(channel.id);
        expect(observed!.reactions[0].total_count).toBe(12);
      });
    });
  });

  describe('chats.dispatchPollState', () => {
    describe('positive', () => {
      it('dispatches poll update with the supplied Poll object', async () => {
        const bot = new Bot('test-token');
        let observed: Poll | undefined;

        bot.on('poll', (ctx) => {
          observed = ctx.update.poll;
        });

        const { chats } = await prepareBot(bot);

        const pollPayload: Poll = {
          id: 'poll-state-1',
          question: 'Favorite color?',
          options: [],
          is_closed: true,
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          allows_revoting: false,
          total_voter_count: 10,
        };

        await chats.dispatchPollState(pollPayload);

        expect(observed).toBeDefined();
        expect(observed!.id).toBe('poll-state-1');
        expect(observed!.is_closed).toBe(true);
        expect(observed!.total_voter_count).toBe(10);
      });
    });
  });
});
