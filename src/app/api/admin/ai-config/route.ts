import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();
const Schema = z.object({ model: z.string().min(1), system_prompt: z.string().min(1), kb_text: z.string().optional() });

export async function GET(){
  const cfg = await prisma.aIConfig.findFirst();
  return NextResponse.json({ ai: cfg });
}

export async function PUT(req: NextRequest){
  const json = await req.json();
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const ai = await prisma.aIConfig.upsert({ where: { id: 'ai' }, create: { id: 'ai', ...parsed.data }, update: parsed.data });
  return NextResponse.json({ ai });
}



