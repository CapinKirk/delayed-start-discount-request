import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const conversation_id = req.nextUrl.searchParams.get("conversation_id");
  const limit = Number(req.nextUrl.searchParams.get("limit") || 50);
  if (!conversation_id) return NextResponse.json({ error: "missing conversation_id" }, { status: 400 });
  const messages = await prisma.message.findMany({
    where: { conversation_id },
    orderBy: { created_at: "asc" },
    take: limit,
  });
  // Resolve display name masking
  const convo = await prisma.conversation.findUnique({ where: { id: conversation_id } });
  const theme = await prisma.widgetTheme.findFirst();
  const mask = theme?.mask_roles ?? true;
  const unified = theme?.unified_display_name || 'Support';
  const transformed = messages.map(m => ({
    ...m,
    display_name: mask && (m.role === 'ai' || m.role === 'agent') ? unified : (m.role === 'agent' ? 'Support' : m.role === 'ai' ? 'Assistant' : 'You'),
  }));
  return NextResponse.json({ messages: transformed });
}


