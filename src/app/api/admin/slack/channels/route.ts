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
      const cookieStore = await cookies();
      const fromCookie = cookieStore.get('slack_token_enc')?.value;
      if (fromCookie) tokenEnc = fromCookie;
    }
    if (!tokenEnc && (globalThis as any).__SLACK_CONN_FALLBACK?.bot_token_enc) {
      tokenEnc = (globalThis as any).__SLACK_CONN_FALLBACK.bot_token_enc;
    }
    if (!tokenEnc) {
      const cookieStore = await cookies();
      return NextResponse.json({ channels: [], error: 'not_connected', info: { sawCookie: !!cookieStore.get('slack_token_enc') } });
    }
    const client = new WebClient(decryptString(tokenEnc));
    const info: any = {};
    try {
      const resp = await client.conversations.list({ limit: 1000, types: 'public_channel,private_channel' });
      const channels = (resp.channels || []).map(c => ({ id: (c as any).id, name: (c as any).name }));
      if (debug) info.typesUsed = 'public_channel,private_channel';
      return NextResponse.json(debug ? { channels, info: { ...info, count: channels.length } } : { channels });
    } catch (e: any) {
      const slackErr = e?.data?.error || e?.message || String(e);
      const needed = e?.data?.needed;
      const provided = e?.data?.provided;
      if (debug) Object.assign(info, { error: slackErr, needed, provided });
      // If missing private channel scope, retry listing only public channels
      const missingGroupsRead = slackErr === 'missing_scope' && (String(needed || '').includes('groups:read') || String(provided || '').includes('channels:read'));
      if (missingGroupsRead) {
        try {
          const respPublic = await client.conversations.list({ limit: 1000, types: 'public_channel' });
          const channels = (respPublic.channels || []).map(c => ({ id: (c as any).id, name: (c as any).name }));
          if (debug) info.fallbackUsed = true, info.typesUsed = 'public_channel';
          return NextResponse.json(debug ? { channels, info: { ...info, count: channels.length } } : { channels });
        } catch (e2: any) {
          const msg2 = e2?.data?.error || e2?.message || String(e2);
          if (debug) info.fallbackError = msg2;
          return NextResponse.json({ channels: [], error: slackErr, info: debug ? info : undefined });
        }
      }
      return NextResponse.json({ channels: [], error: slackErr, info: debug ? info : undefined });
    }
  } catch (e: any) {
    // Pass through Slack Web API errors clearly so the UI can show missing_scope etc.
    const msg = e?.data?.error || e?.message || String(e);
    return NextResponse.json({ channels: [], error: msg }, { status: 200 });
  }
}



