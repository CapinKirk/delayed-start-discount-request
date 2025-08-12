import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@/generated/prisma';

export async function GET(){
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json({ ok: false, db: false, realtime: false }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    // attempt lightweight channel subscribe/unsubscribe
    const ch = supabase.channel('healthcheck', { config: { broadcast: { self: true } } });
    await new Promise<void>((res) => ch.subscribe(() => res()));
    await ch.unsubscribe();
    return NextResponse.json({ ok: true, db: true, realtime: true });
  } catch {
    return NextResponse.json({ ok: false, db: true, realtime: false }, { status: 500 });
  }
}


