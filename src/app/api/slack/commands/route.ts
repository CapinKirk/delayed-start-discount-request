import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { PrismaClient } from '@/generated/prisma';
import { WebClient } from '@slack/web-api';
import { decryptString } from '@/lib/crypto';
import { postOrUpdateController } from '@/lib/slack_controller';

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
  const params = new URLSearchParams(body);
  const command = params.get('command');
  const thread_ts = params.get('thread_ts') || params.get('message_ts') || '';
  const user_id = params.get('user_id') || '';
  const prisma = new PrismaClient();
  const conn = await prisma.slackConnection.findFirst();
  const client = conn ? new WebClient(decryptString(conn.bot_token_enc)) : null;
  const convo = await prisma.conversation.findFirst({ where: { slack_thread_ts: thread_ts } });
  if (!convo || !client || !conn) return NextResponse.json({ ok: true });
  if (command === '/claim') {
    const res = await prisma.conversation.updateMany({ where: { id: convo.id, assigned_agent_id: null }, data: { assigned_agent_id: user_id, assigned_at: new Date(), routing_state: 'agent_active' as any } });
    if (res.count === 0) {
      await client.chat.postEphemeral({ channel: conn.channel_id, user: user_id, text: 'Already owned' });
    } else {
      await postOrUpdateController(thread_ts, { routing_state: 'agent_active', owner_slack_user_id: user_id });
    }
  } else if (command === '/release') {
    await prisma.conversation.update({ where: { id: convo.id }, data: { assigned_agent_id: null, routing_state: 'ai_only' as any } });
    await postOrUpdateController(thread_ts, { routing_state: 'ai_only', owner_slack_user_id: null });
  } else if (command === '/closechat') {
    await prisma.conversation.update({ where: { id: convo.id }, data: { status: 'CLOSED' as any, closed_at: new Date() } });
    await postOrUpdateController(thread_ts, { routing_state: 'ai_only', owner_slack_user_id: null });
  }
  return NextResponse.json({ ok: true });
}



