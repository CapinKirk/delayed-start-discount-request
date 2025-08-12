import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { RealtimePublisher } from "@/lib/realtime";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { conversation_id, text } = await req.json().catch(() => ({}));
  if (!conversation_id || !text) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  // Idempotency via optional header
  const idem = req.headers.get('x-idempotency-key');
  if (idem) {
    const existing = await prisma.eventDedupe.findUnique({ where: { event_id: idem } });
    if (existing) return NextResponse.json({ accepted: true }, { status: 202 });
    await prisma.eventDedupe.create({ data: { source: 'widget', event_id: idem } });
  }

  const msg = await prisma.message.create({
    data: {
      conversation_id,
      role: "user" as any,
      text,
    },
  });

  // publish realtime event
  const pub = new RealtimePublisher();
  const convo = await prisma.conversation.update({ where: { id: conversation_id }, data: { event_seq: { increment: 1 } } });
  const theme = await prisma.widgetTheme.findFirst();
  const mask = theme?.mask_roles ?? true;
  const unified = theme?.unified_display_name || 'Support';
  await pub.publish(conversation_id, { type: 'message.created', payload: { id: msg.id, role: 'user', text, created_at: msg.created_at.toISOString(), seq: (convo.event_seq || 0) + 1, t: Date.now() } });

  return NextResponse.json({ accepted: true }, { status: 202 });
}


