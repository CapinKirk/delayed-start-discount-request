import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const ThemeSchema = z.object({
  public_id: z.string().min(1),
  mask_roles: z.coerce.boolean().default(true),
  unified_display_name: z.string().min(1).default('Support'),
  greeting: z.string().optional().default('Chat with us'),
  avatar_url: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  auto_open_enabled: z.coerce.boolean().default(false),
  auto_open_delay_ms: z.coerce.number().int().min(0).max(600000).default(5000),
  auto_open_greeting: z.string().optional().default(''),
  auto_open_frequency: z.enum(['once_per_session', 'every_visit']).default('once_per_session'),
  primary: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
});

export async function GET(req: NextRequest) {
  const public_id = req.nextUrl.searchParams.get('public_id') || process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo';
  const existing = await prisma.widgetTheme.findFirst({ where: { public_id } });
  const theme = existing || {
    public_id,
    mask_roles: true,
    unified_display_name: 'Support',
    greeting: 'Chat with us',
    avatar_url: undefined,
    auto_open_enabled: false,
    auto_open_delay_ms: 5000,
    auto_open_greeting: '',
    auto_open_frequency: 'once_per_session',
    colors: { primary: '#111827' },
    position: 'bottom-right',
  };
  return NextResponse.json({ theme });
}

export async function PUT(req: NextRequest) {
  const json = await req.json();
  const parsed = ThemeSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { public_id, primary, ...rest } = parsed.data as any;
  const colorUpdate = { colors: { primary: primary || (rest?.colors?.primary) || '#111827' } as any };
  const theme = await prisma.widgetTheme.upsert({
    where: { public_id },
    create: { public_id, ...colorUpdate, position: 'bottom-right', greeting: rest.greeting || 'Chat with us', ...rest },
    update: { ...rest, ...colorUpdate } as any,
  });
  return NextResponse.json({ theme });
}



