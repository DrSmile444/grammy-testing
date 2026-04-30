import { describe, expect, it } from 'vitest';

import {
  GenericMockUpdate,
  LeftMemberMockUpdate,
  MessageMockUpdate,
  MessagePrivateMockUpdate,
  MyChatMemberMockUpdate,
  NewMemberMockUpdate,
} from '../../../src/low-level';

describe('GenericMockUpdate', () => {
  it('exposes the canonical fixtures', () => {
    const instance = new MessagePrivateMockUpdate('hi');

    expect(instance).toBeInstanceOf(GenericMockUpdate);
    expect(instance.genericUser.is_bot).toBe(false);
    expect(instance.genericUser2.is_bot).toBe(false);
    expect(instance.genericPrivateChat.type).toBe('private');
    expect(instance.genericGroupChat.type).toBe('group');
    expect(instance.genericSuperGroup.type).toBe('supergroup');
    expect(instance.genericChannelChat.type).toBe('channel');
    expect(instance.genericOwner.status).toBe('creator');
    expect(instance.genericAdmin.status).toBe('administrator');
    expect(instance.genericUserMember.status).toBe('member');
  });
});

describe('MessagePrivateMockUpdate', () => {
  it('build returns a valid private message update', () => {
    const update = new MessagePrivateMockUpdate('hello').build();

    expect(update.update_id).toBeDefined();
    expect(update.message?.text).toBe('hello');
    expect(update.message?.chat.type).toBe('private');
    expect(update.message?.from.is_bot).toBe(false);
  });

  it('buildOverwrite deep-merges fields', () => {
    const update = new MessagePrivateMockUpdate('/start').buildOverwrite({
      message: {
        entities: [{ offset: 0, length: 6, type: 'bot_command' }],
      },
    });

    expect(update.message?.text).toBe('/start');

    expect(update.message?.entities).toEqual([{ offset: 0, length: 6, type: 'bot_command' }]);

    expect(update.message?.from).toBeDefined();
    expect(update.message?.chat.type).toBe('private');
  });
});

describe('MessageMockUpdate (supergroup)', () => {
  it('build uses the supergroup chat fixture', () => {
    const update = new MessageMockUpdate('hi').build();

    expect(update.message?.chat.type).toBe('supergroup');
    expect(update.message?.chat.id).toBe(202_212);
  });

  it('buildOverwrite arrays REPLACE, objects MERGE', () => {
    const update = new MessageMockUpdate('hi').buildOverwrite({
      message: {
        entities: [{ offset: 0, length: 1, type: 'mention' }],
        from: { username: 'override' },
      },
    });

    expect(update.message?.entities).toEqual([{ offset: 0, length: 1, type: 'mention' }]);

    expect(update.message?.from.username).toBe('override');
    expect(update.message?.from.id).toBe(1_111_111);
  });
});

describe('NewMemberMockUpdate', () => {
  it('emits the join service message', () => {
    const update = new NewMemberMockUpdate().build();

    expect(update.message?.new_chat_members).toBeDefined();
    expect(update.message?.new_chat_members?.length).toBeGreaterThan(0);
    expect(['group', 'supergroup']).toContain(update.message?.chat.type);
  });
});

describe('LeftMemberMockUpdate', () => {
  it('emits the leave service message', () => {
    const update = new LeftMemberMockUpdate().build();

    expect(update.message?.left_chat_member).toBeDefined();
    expect(['group', 'supergroup']).toContain(update.message?.chat.type);
  });
});

describe('MyChatMemberMockUpdate', () => {
  it('emits a my_chat_member update with old and new status', () => {
    const update = new MyChatMemberMockUpdate().build();

    expect(update.my_chat_member).toBeDefined();
    expect(update.my_chat_member?.old_chat_member.status).toBe('member');
    expect(update.my_chat_member?.new_chat_member.status).toBe('administrator');
  });
});
