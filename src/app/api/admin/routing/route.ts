import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();
const Schema = z.object({ timeout_seconds: z.number().int().min(5).max(600), human_suppression_minutes: z.number().int().min(1).max(120) });

export async function GET(){
  const p = await prisma.routingPolicy.findFirst();
  return NextResponse.json({ routing: p });
}

export async function PUT(req: NextRequest){
  const json = await req.json();
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const p = await prisma.routingPolicy.upsert({ where: { id: 'policy' }, create: { id: 'policy', ...parsed.data }, update: parsed.data });
  return NextResponse.json({ routing: p });
}


