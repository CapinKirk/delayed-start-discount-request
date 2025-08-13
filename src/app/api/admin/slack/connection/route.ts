import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();
const Schema = z.object({ channel_id: z.string().min(1) });

declare global { var __SLACK_CONN_FALLBACK: { team_id: string; team_name: string; channel_id: string } | undefined }

export async function GET(){
  try {
    const c = await prisma.slackConnection.findFirst();
    return NextResponse.json({ connection: c ? { team_id: c.team_id, team_name: c.team_name, channel_id: c.channel_id } : null });
  } catch {
    // Fallback when database is unavailable (Preview)
    return NextResponse.json({ connection: globalThis.__SLACK_CONN_FALLBACK || null });
  }
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
    return NextResponse.json({ connection: globalThis.__SLACK_CONN_FALLBACK });
  }
}



