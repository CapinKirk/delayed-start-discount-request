import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { RealtimePublisher } from "@/lib/realtime";
import { postOrUpdateController } from "@/lib/slack_controller";

// Minimal Slack signature verification
function isSlackSignatureValid(req: NextRequest, bodyText: string): boolean {
  const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
  const signature = req.headers.get("x-slack-signature") ?? "";
  const versioned = `v0:${timestamp}:${bodyText}`;
  const hmac = crypto
    .createHmac("sha256", process.env.SLACK_SIGNING_SECRET || "")
    .update(versioned, "utf8")
    .digest("hex");
  const expected = `v0=${hmac}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();

  // Slack URL verification
  try {
    const payload = JSON.parse(bodyText);
    if (payload?.type === "url_verification" && payload?.challenge) {
      return new NextResponse(payload.challenge, {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    }
  } catch {
    // ignore parse error here; may still be valid
  }

  if (!isSlackSignatureValid(req, bodyText)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let eventEnvelope: any;
  try {
    eventEnvelope = JSON.parse(bodyText);
  } catch (err) {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Slack Events API requirement: respond within 3s
  // Acknowledge first; enqueue processing via DB/Realtime in background
  queueMicrotask(async () => {
    const prisma = new PrismaClient();
    const pub = new RealtimePublisher();
    try {
      if (eventEnvelope?.team_id && eventEnvelope?.event_id) {
        const key = `${eventEnvelope.team_id}:${eventEnvelope.event_id}`;
        const existing = await prisma.eventDedupe.findUnique({ where: { event_id: key } });
        if (existing) return;
        await prisma.eventDedupe.create({ data: { source: 'slack', event_id: key } });
      }
      const ev = eventEnvelope?.event;
      if (ev && ev.type === 'message' && ev.thread_ts && ev.user && !ev.subtype) {
        // Agent reply detected in a thread; map thread_ts to conversation
        const convo = await prisma.conversation.findFirst({ where: { slack_thread_ts: ev.thread_ts } });
        if (convo) {
          const msg = await prisma.message.create({ data: { conversation_id: convo.id, role: 'agent' as any, text: ev.text || '', slack_ts: ev.ts } });
          const updated = await prisma.conversation.update({ where: { id: convo.id }, data: { event_seq: { increment: 1 } } });
          await pub.publish(convo.id, { type: 'message.created', payload: { id: msg.id, role: 'agent', text: msg.text, created_at: msg.created_at.toISOString(), seq: (updated.event_seq || 0), t: Date.now() } });
          // Suppress AI for configured minutes
          const rp = await prisma.routingPolicy.findFirst();
          const minutes = rp?.human_suppression_minutes || 5;
          const until = new Date(Date.now() + minutes * 60 * 1000);
          // Auto-claim if no owner
          let claimed = false;
          if (!convo.assigned_agent_id) {
            const res = await prisma.conversation.updateMany({ where: { id: convo.id, assigned_agent_id: null }, data: { assigned_agent_id: ev.user, assigned_at: new Date(), routing_state: 'agent_active' as any } });
            claimed = res.count > 0;
          } else {
            await prisma.conversation.update({ where: { id: convo.id }, data: { routing_state: 'agent_active' as any } });
          }
          await prisma.conversation.update({ where: { id: convo.id }, data: { human_suppressed_until: until } });
          const updated2 = await prisma.conversation.update({ where: { id: convo.id }, data: { event_seq: { increment: 1 } } });
          await pub.publish(convo.id, { type: 'handoff.started', payload: { agent_id: ev.user, seq: (updated2.event_seq || 0), t: Date.now() } });
          await postOrUpdateController(ev.thread_ts, { routing_state: 'agent_active', owner_slack_user_id: ev.user });
        }
      } else if (ev && ev.type === 'reaction_added') {
        // Optional reaction claim (on parent message)
        const conn = await prisma.slackConnection.findFirst();
        const emoji = conn?.reaction_claim_emoji || '✅';
        if (ev.reaction === emoji) {
          const channel = ev.item?.channel;
          const ts = ev.item?.ts;
          if (channel && ts) {
            const convo = await prisma.conversation.findFirst({ where: { slack_thread_ts: ts } });
            if (convo) {
              const res = await prisma.conversation.updateMany({ where: { id: convo.id, assigned_agent_id: null }, data: { assigned_agent_id: ev.user, assigned_at: new Date(), routing_state: 'agent_active' as any } });
              if (res.count > 0) {
                await postOrUpdateController(ts, { routing_state: 'agent_active', owner_slack_user_id: ev.user });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('slack event processing error');
    } finally {
      await prisma.$disconnect();
    }
  });
  return NextResponse.json({ ok: true });
}



