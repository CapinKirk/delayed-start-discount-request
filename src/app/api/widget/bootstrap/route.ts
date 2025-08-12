import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

export async function GET(req: NextRequest) {
  const prisma = new PrismaClient();
  const public_id = req.nextUrl.searchParams.get('public_id') || process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo';
  const theme = await prisma.widgetTheme.findFirst({ where: { public_id } });
  return NextResponse.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    mask_roles: theme?.mask_roles ?? true,
    unified_display_name: theme?.unified_display_name || 'Support',
    auto_open_enabled: theme?.auto_open_enabled ?? false,
    auto_open_delay_ms: theme?.auto_open_delay_ms ?? 5000,
    auto_open_greeting: theme?.auto_open_greeting || '',
    auto_open_frequency: theme?.auto_open_frequency || 'once_per_session',
  });
}


