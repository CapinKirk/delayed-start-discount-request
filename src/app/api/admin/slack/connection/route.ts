import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();
const Schema = z.object({ channel_id: z.string().min(1) });

export async function GET(){
  const c = await prisma.slackConnection.findFirst();
  return NextResponse.json({ connection: c ? { team_id: c.team_id, team_name: c.team_name, channel_id: c.channel_id } : null });
}

export async function PUT(req: NextRequest){
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const c = await prisma.slackConnection.findFirst();
  if (!c) return NextResponse.json({ error: 'not_connected' }, { status: 400 });
  const updated = await prisma.slackConnection.update({ where: { id: c.id }, data: { channel_id: parsed.data.channel_id } });
  return NextResponse.json({ connection: { team_id: updated.team_id, team_name: updated.team_name, channel_id: updated.channel_id } });
}



