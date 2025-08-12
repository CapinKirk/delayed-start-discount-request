jest.mock('@supabase/supabase-js', () => {
  const send = jest.fn().mockResolvedValue(undefined);
  const unsubscribe = jest.fn().mockResolvedValue(undefined);
  const subscribe = jest.fn().mockImplementation((cb: any) => { cb('SUBSCRIBED'); return Promise.resolve(); });
  const channel = jest.fn().mockReturnValue({ send, unsubscribe, subscribe });
  return { createClient: jest.fn().mockReturnValue({ channel }) };
});

import { RealtimePublisher } from '@/lib/realtime';

describe('realtime publisher', () => {
  it('publishes to conversation channel', async () => {
    const pub = new RealtimePublisher();
    await expect(pub.publish('convo', { type: 'ai.done', payload: { message_id: 'id', seq: 1, t: Date.now() } })).resolves.toBeUndefined();
  });
});


