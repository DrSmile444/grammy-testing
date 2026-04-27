import { describe, expect, it } from 'vitest';

import * as defaultEntry from '../../src/index';
import * as lowLevelEntry from '../../src/low-level';

describe('package exports', () => {
  it('default entry exposes the curated surface', () => {
    expect(typeof defaultEntry.prepareBot).toBe('function');
    expect(typeof defaultEntry.prepareComposer).toBe('function');
    expect(typeof defaultEntry.prepareMiddleware).toBe('function');
    expect(typeof defaultEntry.OutgoingRequests).toBe('function');
    expect(typeof defaultEntry.GrammyError).toBe('function');
    expect(typeof defaultEntry.mockSession).toBe('function');
    expect(typeof defaultEntry.mockChatSession).toBe('function');
    expect(typeof defaultEntry.mockState).toBe('function');
    expect(typeof defaultEntry.mockContextField).toBe('function');
  });

  it('default entry does NOT expose update builders', () => {
    expect((defaultEntry as Record<string, unknown>).MessagePrivateMockUpdate).toBeUndefined();
    expect((defaultEntry as Record<string, unknown>).MessageMockUpdate).toBeUndefined();
    expect((defaultEntry as Record<string, unknown>).NewMemberMockUpdate).toBeUndefined();
    expect((defaultEntry as Record<string, unknown>).LeftMemberMockUpdate).toBeUndefined();
    expect((defaultEntry as Record<string, unknown>).MyChatMemberMockUpdate).toBeUndefined();
    expect((defaultEntry as Record<string, unknown>).GenericMockUpdate).toBeUndefined();
  });

  it('low-level entry includes everything from default plus builders', () => {
    expect(typeof lowLevelEntry.prepareBot).toBe('function');
    expect(typeof lowLevelEntry.MessagePrivateMockUpdate).toBe('function');
    expect(typeof lowLevelEntry.MessageMockUpdate).toBe('function');
    expect(typeof lowLevelEntry.NewMemberMockUpdate).toBe('function');
    expect(typeof lowLevelEntry.LeftMemberMockUpdate).toBe('function');
    expect(typeof lowLevelEntry.MyChatMemberMockUpdate).toBe('function');
    expect(typeof lowLevelEntry.GenericMockUpdate).toBe('function');
  });
});
