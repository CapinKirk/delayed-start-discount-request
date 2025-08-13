import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { postParentMessageReturnThreadTs } from "@/lib/slack";
import { assignNextAgent, getBusinessHoursNow } from "@/lib/routing";
import { postSystemMessage } from "@/lib/slack";
import { postOrUpdateController } from "@/lib/slack_controller";
import { RealtimePublisher } from "@/lib/realtime";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const qp = Object.fromEntries(url.searchParams.entries());
  const { session_id } = await req.json().catch(() => ({ session_id: "" }));
  if (!session_id) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

  // Find open conversation or create new
  let convo = await prisma.conversation.findFirst({ where: { session_id, status: "OPEN" } as any });
  if (!convo) {
    const slack = await prisma.slackConnection.findFirst();
    // create parent message & thread
    let thread_ts: string | undefined = undefined;
    if (slack?.channel_id) {
      const lines = [
        `New chat from website visitor`,
        qp.email ? `email: ${qp.email}` : '',
        qp.first_name || qp.last_name ? `name: ${(qp.first_name||'')} ${(qp.last_name||'')}`.trim() : '',
        qp.business ? `business: ${qp.business}` : '',
        qp.utm_source ? `utm_source: ${qp.utm_source}` : '',
        qp.utm_medium ? `utm_medium: ${qp.utm_medium}` : '',
        qp.utm_campaign ? `utm_campaign: ${qp.utm_campaign}` : '',
        qp.utm_term ? `utm_term: ${qp.utm_term}` : '',
        qp.utm_content ? `utm_content: ${qp.utm_content}` : '',
        qp.utm_id ? `utm_id: ${qp.utm_id}` : '',
      ].filter(Boolean).join('\n');
      const parent = await postParentMessageReturnThreadTs(lines);
      thread_ts = parent?.thread_ts;
    }
    convo = await prisma.conversation.create({
      data: {
        session_id,
        slack_channel_id: slack?.channel_id || "",
        slack_thread_ts: thread_ts,
      },
    });

    // Routing during business hours
    const { inHours } = await getBusinessHoursNow();
    if (inHours && thread_ts) {
      const { agentId } = await assignNextAgent();
      if (agentId) {
        await prisma.conversation.update({ where: { id: convo.id }, data: { assigned_agent_id: agentId, assigned_at: new Date(), routing_state: 'pending_agent' as any } });
        await postSystemMessage(thread_ts, `Assigned to <@${agentId}>`);
        await postOrUpdateController(thread_ts, { routing_state: 'pending_agent', owner_slack_user_id: null });
      }
      const pub = new RealtimePublisher();
      const updated = await prisma.conversation.update({ where: { id: convo.id }, data: { event_seq: { increment: 1 } } });
      await pub.publish(convo.id, { type: 'handoff.started', payload: { agent_id: (agentId || ''), seq: (updated.event_seq || 0), t: Date.now() } });
    }
  }
  return NextResponse.json({ conversation_id: convo.id });
}


