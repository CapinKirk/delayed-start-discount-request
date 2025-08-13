import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const ThemeSchema = z.object({
  public_id: z.string().min(1),
  mask_roles: z.boolean(),
  unified_display_name: z.string().min(1),
  greeting: z.string().min(0).optional(),
  avatar_url: z.string().url().optional().or(z.literal('').transform(()=>undefined)),
  auto_open_enabled: z.boolean(),
  auto_open_delay_ms: z.number().int().min(0).max(600000),
  auto_open_greeting: z.string().optional().default(''),
  auto_open_frequency: z.enum(['once_per_session', 'every_visit']),
});

export async function GET(req: NextRequest) {
  const public_id = req.nextUrl.searchParams.get('public_id') || process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo';
  const theme = await prisma.widgetTheme.findFirst({ where: { public_id } });
  return NextResponse.json({ theme });
}

export async function PUT(req: NextRequest) {
  const json = await req.json();
  const parsed = ThemeSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { public_id, ...rest } = parsed.data;
  const theme = await prisma.widgetTheme.upsert({
    where: { public_id },
    create: { public_id, colors: { primary: '#111827' } as any, position: 'bottom-right', greeting: rest.greeting || 'Chat with us', ...rest },
    update: rest as any,
  });
  return NextResponse.json({ theme });
}



