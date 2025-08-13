import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const public_id = req.nextUrl.searchParams.get('public_id') || process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo';
  const theme = await prisma.widgetTheme.findFirst({ where: { public_id } });
  return NextResponse.json({
    position: theme?.position || 'bottom-right',
    greeting: theme?.greeting || 'Hi! How can we help?',
    avatar_url: theme?.avatar_url || null,
    colors: (theme?.colors as any) || { primary: '#111827' },
    mask_roles: theme?.mask_roles ?? true,
    unified_display_name: theme?.unified_display_name || 'Support',
  });
}



