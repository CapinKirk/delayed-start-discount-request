import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@/generated/prisma';
import { decryptString } from '@/lib/crypto';

export async function GET(){
  try {
    const prisma = new PrismaClient();
    const conn = await prisma.slackConnection.findFirst();
    if (!conn) return NextResponse.json({ channels: [] });
    const client = new WebClient(decryptString(conn.bot_token_enc));
    const resp = await client.conversations.list({ limit: 1000, types: 'public_channel,private_channel' });
    const channels = (resp.channels || []).map(c => ({ id: (c as any).id, name: (c as any).name }));
    return NextResponse.json({ channels });
  } catch (e: any) {
    return NextResponse.json({ channels: [], error: String(e?.message || e) }, { status: 200 });
  }
}



