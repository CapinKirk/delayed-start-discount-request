import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@/generated/prisma';
import { decryptString } from '@/lib/crypto';

export const runtime = 'nodejs';
export async function GET(req: NextRequest){
  try {
    const prisma = new PrismaClient();
    let tokenEnc: string | null = null;
    const debug = req.nextUrl.searchParams.get('debug') === '1';
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
    if (!tokenEnc) return NextResponse.json({ channels: [], error: 'not_connected', info: { sawCookie: !!cookies().get('slack_token_enc') } });
    const client = new WebClient(decryptString(tokenEnc));
    const resp = await client.conversations.list({ limit: 1000, types: 'public_channel,private_channel' });
    const channels = (resp.channels || []).map(c => ({ id: (c as any).id, name: (c as any).name }));
    return NextResponse.json(debug ? { channels, info: { count: channels.length } } : { channels });
  } catch (e: any) {
    return NextResponse.json({ channels: [], error: 'exception', info: { message: String(e?.message || e), stack: e?.stack } }, { status: 200 });
  }
}



