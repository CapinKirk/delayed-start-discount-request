import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { assignAfter, getRoutingPolicy } from '@/lib/routing';
import { postSystemMessage } from '@/lib/slack';
import { postOrUpdateController } from '@/lib/slack_controller';

export async function GET(){
  const prisma = new PrismaClient();
  const { timeoutSeconds } = await getRoutingPolicy();
  const cutoff = new Date(Date.now() - timeoutSeconds * 1000);
  const convos = await prisma.conversation.findMany({
    where: {
      routing_state: 'pending_agent' as any,
      assigned_at: { lt: cutoff },
      status: 'OPEN' as any,
    }
  });
  for (const c of convos) {
    const next = await assignAfter(c.assigned_agent_id);
    if (next.agentId && c.slack_thread_ts) {
      await prisma.conversation.update({ where: { id: c.id }, data: { assigned_agent_id: next.agentId, assigned_at: new Date() } });
      await postSystemMessage(c.slack_thread_ts, `Reassigning to <@${next.agentId}> due to no response`);
      await postOrUpdateController(c.slack_thread_ts, { routing_state: 'pending_agent', owner_slack_user_id: null });
    } else if (c.slack_thread_ts) {
      await prisma.conversation.update({ where: { id: c.id }, data: { routing_state: 'ai_only' as any } });
      await postSystemMessage(c.slack_thread_ts, `Continuing with AI`);
      await postOrUpdateController(c.slack_thread_ts, { routing_state: 'ai_only', owner_slack_user_id: null });
    }
  }
  return NextResponse.json({ reassigned: convos.length });
}


