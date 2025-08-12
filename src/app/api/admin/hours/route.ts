import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();
const Row = z.object({ tz: z.string(), weekday: z.number().int().min(0).max(6), start_local_time: z.string(), end_local_time: z.string() });

export async function GET(){
  const rows = await prisma.businessHours.findMany({ orderBy: { weekday: 'asc' } });
  return NextResponse.json({ hours: rows });
}

export async function PUT(req: NextRequest){
  const json = await req.json();
  if (!Array.isArray(json)) return NextResponse.json({ error: 'expected array' }, { status: 400 });
  const parsed = json.every((r: any) => Row.safeParse(r).success);
  if (!parsed) return NextResponse.json({ error: 'invalid rows' }, { status: 400 });
  await prisma.$transaction([
    prisma.businessHours.deleteMany({}),
    prisma.businessHours.createMany({ data: json as any }),
  ]);
  return NextResponse.json({ ok: true });
}


