import { describe, expect, it } from 'vitest';

import { OutgoingRequests } from '../../src/index';

describe('OutgoingRequests', () => {
  describe('basic capture surface', () => {
    it('starts empty', () => {
      const outgoing = new OutgoingRequests();

      expect(outgoing.requests).toEqual([]);
      expect(outgoing.length).toBe(0);
    });

    it('push appends and length tracks', () => {
      const outgoing = new OutgoingRequests();

      outgoing.push({ method: 'getMe', payload: {} }, { method: 'sendMessage', payload: { chat_id: 1, text: 'hi' } });

      expect(outgoing.length).toBe(2);
      expect(outgoing.requests[0]?.method).toBe('getMe');
      expect(outgoing.requests[1]?.method).toBe('sendMessage');
    });

    it('clear empties the collector', () => {
      const outgoing = new OutgoingRequests();

      outgoing.push({ method: 'getMe', payload: {} });
      outgoing.clear();

      expect(outgoing.length).toBe(0);
      expect(outgoing.requests).toEqual([]);
    });
  });

  describe('typed accessors', () => {
    it('getMethods returns names in order', () => {
      const outgoing = new OutgoingRequests();

      outgoing.push(
        { method: 'getChat', payload: { chat_id: 1 } },
        { method: 'sendMessage', payload: { chat_id: 1, text: 'hi' } },
        { method: 'deleteMessage', payload: { chat_id: 1, message_id: 1 } },
      );

      expect(outgoing.getMethods()).toEqual(['getChat', 'sendMessage', 'deleteMessage']);
    });

    it('buildMethods is a typed pass-through', () => {
      const outgoing = new OutgoingRequests();

      const expected = outgoing.buildMethods(['getChat', 'sendMessage']);

      expect(expected).toEqual(['getChat', 'sendMessage']);
    });

    it('getFirst returns the first request or null', () => {
      const outgoing = new OutgoingRequests();

      expect(outgoing.getFirst()).toBeNull();

      outgoing.push({ method: 'getMe', payload: {} });

      expect(outgoing.getFirst()?.method).toBe('getMe');
    });

    it('getLast returns the most recent request or null', () => {
      const outgoing = new OutgoingRequests();

      expect(outgoing.getLast()).toBeNull();

      outgoing.push({ method: 'getMe', payload: {} }, { method: 'sendMessage', payload: { chat_id: 1, text: 'hi' } });

      expect(outgoing.getLast()?.method).toBe('sendMessage');
    });

    it('getTwoLast returns the trailing two requests', () => {
      const outgoing = new OutgoingRequests();

      outgoing.push(
        { method: 'getMe', payload: {} },
        { method: 'sendMessage', payload: { chat_id: 1, text: 'a' } },
        { method: 'deleteMessage', payload: { chat_id: 1, message_id: 1 } },
      );

      const trailing = outgoing.getTwoLast();

      expect(trailing[0]?.method).toBe('sendMessage');
      expect(trailing[1]?.method).toBe('deleteMessage');
    });

    it('getThreeLast returns the trailing three', () => {
      const outgoing = new OutgoingRequests();

      outgoing.push(
        { method: 'getMe', payload: {} },
        { method: 'getChat', payload: { chat_id: 1 } },
        { method: 'sendMessage', payload: { chat_id: 1, text: 'a' } },
        { method: 'deleteMessage', payload: { chat_id: 1, message_id: 1 } },
      );

      const trailing = outgoing.getThreeLast();

      expect(trailing[0]?.method).toBe('getChat');
      expect(trailing[1]?.method).toBe('sendMessage');
      expect(trailing[2]?.method).toBe('deleteMessage');
    });

    it('getAll returns all captured requests with typed-tuple support', () => {
      const outgoing = new OutgoingRequests();

      outgoing.push({ method: 'getMe', payload: {} }, { method: 'sendMessage', payload: { chat_id: 1, text: 'hi' } });

      // Typed-tuple form: type args inform destructuring
      const [first, second] = outgoing.getAll<'getMe', 'sendMessage'>();

      expect(first?.method).toBe('getMe');
      expect(second?.method).toBe('sendMessage');
      expect(outgoing.requests).toHaveLength(2);
    });
  });
});
