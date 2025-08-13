import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.INIT_SECRET || '';
  const provided = req.headers.get('x-init-secret') || '';
  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const prisma = new PrismaClient();
  try {
    // Quick existence check
    await prisma.$queryRaw`SELECT 1 FROM "public"."SlackConnection" LIMIT 1`;
    return NextResponse.json({ ok: true, alreadyInitialized: true });
  } catch {}

  try {
    const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', '20250812143817_init', 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    // Split on semicolons that end statements; simple but effective for our migration
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    return NextResponse.json({ ok: true, migrated: true, statements: statements.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}



