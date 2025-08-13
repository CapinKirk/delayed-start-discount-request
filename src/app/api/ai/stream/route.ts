import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PrismaClient } from "@/generated/prisma";
import { RealtimePublisher } from "@/lib/realtime";
import { postThreadMessage } from "@/lib/slack";
import { decryptString } from "@/lib/crypto";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { conversation_id } = await req.json().catch(() => ({}));
  if (!conversation_id) return NextResponse.json({ error: "missing conversation_id" }, { status: 400 });

  const aiConfig = await prisma.aIConfig.findFirst();
  const messages = await prisma.message.findMany({ where: { conversation_id }, orderBy: { created_at: "asc" } });
  // Suppression check
  const convo = await prisma.conversation.findUnique({ where: { id: conversation_id } });
  const now = new Date();
  if (convo?.human_suppressed_until && convo.human_suppressed_until > now) {
    return NextResponse.json({ suppressed: true });
  }

  const configuredKey = aiConfig?.api_key_enc ? decryptString(aiConfig.api_key_enc) : undefined;
  const apiKey = configuredKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing_openai_api_key" }, { status: 400 });
  }
  const client = new OpenAI({ apiKey });
  const pub = new RealtimePublisher();

  const content = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
  const stream = await client.chat.completions.create({
    model: aiConfig?.model || "gpt-5",
    messages: [
      { role: "system", content: aiConfig?.system_prompt || "You are a helpful assistant." },
      { role: "user", content },
    ],
    stream: true,
  } as any);

  let finalText = "";
  for await (const chunk of (stream as any)) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      finalText += delta;
      const updated = await prisma.conversation.update({ where: { id: conversation_id }, data: { event_seq: { increment: 1 } } });
      await pub.publish(conversation_id, { type: 'ai.delta', payload: { text: delta, seq: (updated.event_seq || 0), t: Date.now() } });
    }
  }

  const msg = await prisma.message.create({ data: { conversation_id, role: 'ai' as any, text: finalText } });
  const updated2 = await prisma.conversation.update({ where: { id: conversation_id }, data: { event_seq: { increment: 1 } } });
  await pub.publish(conversation_id, { type: 'ai.done', payload: { message_id: msg.id, seq: (updated2.event_seq || 0), t: Date.now() } });

  if (convo?.slack_thread_ts && finalText) {
    await postThreadMessage(convo.slack_thread_ts, finalText);
  }

  return NextResponse.json({ message_id: msg.id, text: finalText });
}


