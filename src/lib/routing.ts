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
  // Return Slack user ID for downstream mention and ownership consistency
  return { agentId: agents[nextIndex].slack_user_id, index: nextIndex };
}

export async function assignAfter(currentAgentId: string | null): Promise<{ agentId: string | null, index: number }>{
  const agents = await prisma.agent.findMany({ where: { active: true }, orderBy: { order_index: 'asc' } });
  if (!agents.length) return { agentId: null, index: -1 };
  if (!currentAgentId) return assignNextAgent();
  // currentAgentId is the Slack user ID when set on the conversation
  const idx = agents.findIndex(a => a.slack_user_id === currentAgentId);
  if (idx < 0) return assignNextAgent();
  const nextIndex = (idx + 1) % agents.length;
  return { agentId: agents[nextIndex].slack_user_id, index: nextIndex };
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
  // Compute in-hours if ANY configured row matches in its own timezone
  return hours.some((h) => {
    const tz = h.tz || 'UTC';
    // Determine weekday in that timezone
    const weekdayShort = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const weekdayInTz = weekdayMap[weekdayShort as keyof typeof weekdayMap];
    if (typeof weekdayInTz !== 'number') return false;
    if (weekdayInTz !== h.weekday) return false;
    // Current HH:mm in that timezone
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(now);
    const hh = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const mm = parts.find((p) => p.type === 'minute')?.value ?? '00';
    const cur = `${hh}:${mm}`;
    return cur >= h.start_local_time && cur <= h.end_local_time;
  });
}


