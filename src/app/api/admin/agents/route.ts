import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const AgentSchema = z.object({
  slack_user_id: z.string(),
  display_name: z.string(),
  active: z.boolean().optional().default(true),
  order_index: z.number().int().min(0).max(3),
});

export async function GET() {
  const agents = await prisma.agent.findMany({ orderBy: { order_index: 'asc' } });
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest){
  const data = await req.json();
  const parsed = AgentSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const agent = await prisma.agent.create({ data: parsed.data as any });
  return NextResponse.json({ agent });
}

export async function PUT(req: NextRequest){
  const list = await req.json();
  if (!Array.isArray(list)) return NextResponse.json({ error: 'expected array' }, { status: 400 });
  for (const a of list) {
    const parsed = AgentSchema.extend({ id: z.string() }).safeParse(a);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  await Promise.all(list.map((a: any) => prisma.agent.update({ where: { id: a.id }, data: a })));
  return NextResponse.json({ ok: true });
}


