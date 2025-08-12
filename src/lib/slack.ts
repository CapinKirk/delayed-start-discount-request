import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@/generated/prisma';
import { encryptString, decryptString } from './crypto';

const prisma = new PrismaClient();

export async function getSlackClient(): Promise<WebClient | null> {
  const conn = await prisma.slackConnection.findFirst();
  if (!conn) return null;
  const token = decryptString(conn.bot_token_enc);
  return new WebClient(token);
}

export async function postParentMessageReturnThreadTs(text: string): Promise<{ channel: string; thread_ts: string } | null> {
  const conn = await prisma.slackConnection.findFirst();
  if (!conn) return null;
  const client = await getSlackClient();
  if (!client) return null;
  const res = await client.chat.postMessage({ channel: conn.channel_id, text });
  const thread_ts = (res.ts as string) || '';
  return { channel: conn.channel_id, thread_ts };
}

export async function postThreadMessage(thread_ts: string, text: string, idemKey?: string): Promise<string | null> {
  const conn = await prisma.slackConnection.findFirst();
  if (!conn) return null;
  const client = await getSlackClient();
  if (!client) return null;
  // Idempotency: Slack API doesn't support keys; emulate by storing idem event
  if (idemKey) {
    const exist = await prisma.eventDedupe.findUnique({ where: { event_id: idemKey } });
    if (exist) return exist.id;
    await prisma.eventDedupe.create({ data: { source: 'slack-post', event_id: idemKey } });
  }
  const res = await client.chat.postMessage({ channel: conn.channel_id, thread_ts, text });
  return (res.ts as string) || null;
}

export async function postSystemMessage(thread_ts: string, text: string) {
  return postThreadMessage(thread_ts, `System: ${text}`);
}

export async function mentionUser(slackUserId: string): Promise<string> {
  return `<@${slackUserId}>`;
}


