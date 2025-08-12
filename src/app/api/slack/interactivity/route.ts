import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { PrismaClient } from '@/generated/prisma';
import { WebClient } from '@slack/web-api';
import { decryptString } from '@/lib/crypto';

function verify(req: NextRequest, body: string) {
  const ts = req.headers.get('x-slack-request-timestamp') || '';
  const sig = req.headers.get('x-slack-signature') || '';
  const base = `v0:${ts}:${body}`;
  const h = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET || '').update(base).digest('hex');
  const expected = `v0=${h}`;
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig)); } catch { return false; }
}

export async function POST(req: NextRequest){
  const body = await req.text();
  if (!verify(req, body)) return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  const payloadStr = new URLSearchParams(body).get('payload') || '{}';
  const payload = JSON.parse(payloadStr);

  const prisma = new PrismaClient();
  try {
    // Dedupe by payload_id
    if (payload?.payload_id) {
      const exists = await prisma.eventDedupe.findUnique({ where: { event_id: payload.payload_id } });
      if (exists) return NextResponse.json({ ok: true });
      await prisma.eventDedupe.create({ data: { source: 'slack-interactivity', event_id: payload.payload_id } });
    }
    const actionId = payload?.actions?.[0]?.action_id;
    const thread_ts = payload?.message?.thread_ts || payload?.container?.thread_ts;
    const user_id = payload?.user?.id;
    if (!actionId || !thread_ts || !user_id) return NextResponse.json({ ok: true });

    const convo = await prisma.conversation.findFirst({ where: { slack_thread_ts: thread_ts } });
    if (!convo) return NextResponse.json({ ok: true });

    // Atomic claim
    if (actionId === 'take_chat') {
      const result = await prisma.conversation.updateMany({
        where: { id: convo.id, assigned_agent_id: null },
        data: { assigned_agent_id: user_id, assigned_at: new Date(), routing_state: 'agent_active' as any },
      });
      if (result.count === 0) {
        // someone else owns it
        const conn = await prisma.slackConnection.findFirst();
        if (conn?.channel_id) {
          const client = new WebClient(decryptString(conn.bot_token_enc));
          await client.chat.postEphemeral({ channel: conn.channel_id, user: user_id, text: `This chat is already owned.` });
        }
      }
    } else if (actionId === 'release_chat') {
      await prisma.conversation.update({ where: { id: convo.id }, data: { assigned_agent_id: null, routing_state: 'ai_only' as any } });
    } else if (actionId === 'close_chat') {
      await prisma.conversation.update({ where: { id: convo.id }, data: { status: 'CLOSED' as any, closed_at: new Date() } });
    }

    // Update controller message (placeholder; computed fingerprint logic TBD)
    const conn = await prisma.slackConnection.findFirst();
    if (conn?.channel_id) {
      const client = new WebClient(decryptString(conn.bot_token_enc));
      const text = actionId === 'take_chat' ? 'Agent active' : actionId === 'release_chat' ? 'AI only' : 'Closed';
      await client.chat.postMessage({ channel: conn.channel_id, thread_ts, text: `System: ${text}` });
    }

    return NextResponse.json({ ok: true });
  } finally {
    await prisma.$disconnect();
  }
}


