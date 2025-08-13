import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@/generated/prisma';
import { decryptString } from '@/lib/crypto';

export async function GET(){
  try {
    const prisma = new PrismaClient();
    let tokenEnc: string | null = null;
    try {
      const conn = await prisma.slackConnection.findFirst();
      tokenEnc = conn?.bot_token_enc || null;
    } catch {}
    if (!tokenEnc) {
      const fromCookie = cookies().get('slack_token_enc')?.value;
      if (fromCookie) tokenEnc = fromCookie;
    }
    if (!tokenEnc && (globalThis as any).__SLACK_CONN_FALLBACK?.bot_token_enc) {
      tokenEnc = (globalThis as any).__SLACK_CONN_FALLBACK.bot_token_enc;
    }
    if (!tokenEnc) return NextResponse.json({ channels: [], error: 'not_connected (no token in DB or preview fallback)' });
    const client = new WebClient(decryptString(tokenEnc));
    const resp = await client.conversations.list({ limit: 1000, types: 'public_channel,private_channel' });
    const channels = (resp.channels || []).map(c => ({ id: (c as any).id, name: (c as any).name }));
    return NextResponse.json({ channels });
  } catch (e: any) {
    return NextResponse.json({ channels: [], error: String(e?.message || e) }, { status: 200 });
  }
}



