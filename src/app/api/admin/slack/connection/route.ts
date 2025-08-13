import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
const prisma = new PrismaClient();
const Schema = z.object({ channel_id: z.string().min(1) });

declare global { var __SLACK_CONN_FALLBACK: { team_id: string; team_name: string; channel_id: string } | undefined }

export async function GET(){
  try {
    const c = await prisma.slackConnection.findFirst();
    if (c) return NextResponse.json({ connection: { team_id: c.team_id, team_name: c.team_name, channel_id: c.channel_id } });
  } catch {}
  // Fallback when database is unavailable (Preview)
  const cookieStore = cookies();
  const fromCookie = cookieStore.get('slack_conn')?.value;
  if (fromCookie) {
    try { return NextResponse.json({ connection: JSON.parse(fromCookie) }); } catch {}
  }
  return NextResponse.json({ connection: (globalThis as any).__SLACK_CONN_FALLBACK || null });
}

export async function PUT(req: NextRequest){
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const c = await prisma.slackConnection.findFirst();
    if (!c) return NextResponse.json({ error: 'not_connected' }, { status: 400 });
    const updated = await prisma.slackConnection.update({ where: { id: c.id }, data: { channel_id: parsed.data.channel_id } });
    return NextResponse.json({ connection: { team_id: updated.team_id, team_name: updated.team_name, channel_id: updated.channel_id } });
  } catch {
    // Fallback save in memory for Preview without DB
    globalThis.__SLACK_CONN_FALLBACK = { team_id: 'preview', team_name: 'Preview', channel_id: parsed.data.channel_id };
    const res = NextResponse.json({ connection: globalThis.__SLACK_CONN_FALLBACK });
    res.cookies.set('slack_conn', JSON.stringify(globalThis.__SLACK_CONN_FALLBACK), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60*60*24*7 });
    return res;
  }
}



