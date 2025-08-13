import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@/generated/prisma';
import { decryptString } from '@/lib/crypto';

export const runtime = 'nodejs';

export async function GET(){
  try {
    const prisma = new PrismaClient();
    let tokenEnc: string | null = null;
    try {
      const conn = await prisma.slackConnection.findFirst();
      tokenEnc = conn?.bot_token_enc || null;
    } catch {}
    if (!tokenEnc) {
      const c = await cookies();
      tokenEnc = c.get('slack_token_enc')?.value || null;
    }
    if (!tokenEnc && (globalThis as any).__SLACK_CONN_FALLBACK?.bot_token_enc) {
      tokenEnc = (globalThis as any).__SLACK_CONN_FALLBACK.bot_token_enc;
    }
    if (!tokenEnc) return NextResponse.json({ users: [], error: 'not_connected' }, { status: 200 });
    const client = new WebClient(decryptString(tokenEnc));
    const resp = await client.users.list({ limit: 999 });
    const users = (resp.members || [])
      .filter((u: any) => !u.is_bot && !u.deleted && u.id && u.profile?.real_name)
      .map((u: any) => ({ id: u.id as string, name: u.profile.real_name as string }));
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ users: [], error: e?.data?.error || e?.message || String(e) }, { status: 200 });
  }
}


