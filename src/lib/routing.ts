import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function getBusinessHoursNow(): Promise<{ inHours: boolean }>{
  const now = new Date();
  const hours = await prisma.businessHours.findMany();
  if (!hours.length) return { inHours: true }; // default in hours
  return { inHours: evaluateHours(hours, now) };
}

export async function assignNextAgent(): Promise<{ agentId: string | null, index: number }>{
  const agents = await prisma.agent.findMany({ where: { active: true }, orderBy: { order_index: 'asc' } });
  if (!agents.length) return { agentId: null, index: -1 };
  let state = await prisma.roundRobinState.findUnique({ where: { id: 'state' } });
  if (!state) state = await prisma.roundRobinState.create({ data: { id: 'state', last_index: -1 } });
  const nextIndex = (state.last_index + 1) % agents.length;
  await prisma.roundRobinState.update({ where: { id: 'state' }, data: { last_index: nextIndex } });
  return { agentId: agents[nextIndex].id, index: nextIndex };
}

export async function assignAfter(currentAgentId: string | null): Promise<{ agentId: string | null, index: number }>{
  const agents = await prisma.agent.findMany({ where: { active: true }, orderBy: { order_index: 'asc' } });
  if (!agents.length) return { agentId: null, index: -1 };
  if (!currentAgentId) return assignNextAgent();
  const idx = agents.findIndex(a => a.id === currentAgentId);
  if (idx < 0) return assignNextAgent();
  const nextIndex = (idx + 1) % agents.length;
  return { agentId: agents[nextIndex].id, index: nextIndex };
}

export async function getRoutingPolicy(): Promise<{ timeoutSeconds: number, suppressionMinutes: number }>{
  const rp = await prisma.routingPolicy.findFirst();
  return { timeoutSeconds: rp?.timeout_seconds ?? 30, suppressionMinutes: rp?.human_suppression_minutes ?? 5 };
}

// Pure helper for tests
export function evaluateHours(
  hours: Array<{ tz: string; weekday: number; start_local_time: string; end_local_time: string }>,
  now: Date
): boolean {
  if (!hours.length) return true;
  const weekday = now.getDay();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const cur = `${hh}:${mm}`;
  const todays = hours.filter((h) => h.weekday === weekday);
  return todays.some((h) => cur >= h.start_local_time && cur <= h.end_local_time);
}


