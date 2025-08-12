import { createClient, RealtimeChannel } from '@supabase/supabase-js';

export type ConversationEvent =
  | { type: 'message.created'; payload: { id: string; role: string; text: string; created_at: string; seq: number; t: number } }
  | { type: 'ai.delta'; payload: { text: string; seq: number; t: number } }
  | { type: 'ai.done'; payload: { message_id: string; seq: number; t: number } }
  | { type: 'handoff.started'; payload: { agent_id: string; seq: number; t: number } }
  | { type: 'handoff.ended'; payload: { agent_id: string; seq: number; t: number } }
  | { type: 'closed'; payload: { seq: number; t: number } };

export class RealtimePublisher {
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  async publish(conversationId: string, event: ConversationEvent): Promise<void> {
    const channelName = `conversation_${conversationId}`;
    // Use broadcast; connection is short-lived per call
    const channel: RealtimeChannel = this.supabase.channel(channelName, { config: { broadcast: { self: true } } });
    await new Promise<void>((resolve) => channel.subscribe(() => resolve()));
    const payloadWithT = { ...event.payload, t: Date.now() } as any;
    await channel.send({ type: 'broadcast', event: event.type, payload: payloadWithT });
    await channel.unsubscribe();
  }
}


