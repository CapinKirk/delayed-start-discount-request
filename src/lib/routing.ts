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
  const activeRegions = await getActiveRegionsNow();
  const filterByRegion = activeRegions.size > 0;
  const isAllowed = (idx: number) => {
    if (!filterByRegion) return true;
    const r = (agents[idx].region || 'GLOBAL').toUpperCase();
    return r === 'GLOBAL' || activeRegions.has(r);
  };
  let i = 0;
  let candidateIndex = -1;
  let cursor = state.last_index;
  while (i < agents.length) {
    cursor = (cursor + 1) % agents.length;
    if (isAllowed(cursor)) { candidateIndex = cursor; break; }
    i++;
  }
  if (candidateIndex < 0) candidateIndex = (state.last_index + 1) % agents.length;
  await prisma.roundRobinState.update({ where: { id: 'state' }, data: { last_index: candidateIndex } });
  return { agentId: agents[candidateIndex].slack_user_id, index: candidateIndex };
}

export async function assignAfter(currentAgentId: string | null): Promise<{ agentId: string | null, index: number }>{
  const agents = await prisma.agent.findMany({ where: { active: true }, orderBy: { order_index: 'asc' } });
  if (!agents.length) return { agentId: null, index: -1 };
  if (!currentAgentId) return assignNextAgent();
  // currentAgentId is the Slack user ID when set on the conversation
  const idx = agents.findIndex(a => a.slack_user_id === currentAgentId);
  if (idx < 0) return assignNextAgent();
  const activeRegions = await getActiveRegionsNow();
  const filterByRegion = activeRegions.size > 0;
  const isAllowed = (i: number) => {
    if (!filterByRegion) return true;
    const r = (agents[i].region || 'GLOBAL').toUpperCase();
    return r === 'GLOBAL' || activeRegions.has(r);
  };
  let i = 0;
  let cursor = idx;
  while (i < agents.length) {
    cursor = (cursor + 1) % agents.length;
    if (isAllowed(cursor)) return { agentId: agents[cursor].slack_user_id, index: cursor };
    i++;
  }
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
    const tz = (h.tz || 'UTC').split('|').pop() as string; // support REGION|TZ encoding
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

export async function getActiveRegionsNow(): Promise<Set<string>> {
  const now = new Date();
  const hours = await prisma.businessHours.findMany();
  const active = new Set<string>();
  for (const h of hours) {
    const parts = (h.tz || 'GLOBAL|UTC').split('|');
    const region = (parts[0] || 'GLOBAL').toUpperCase();
    const tz = (parts[1] || parts[0] || 'UTC');
    const inRegion = evaluateHours([{ tz, weekday: h.weekday, start_local_time: h.start_local_time, end_local_time: h.end_local_time }], now);
    if (inRegion) active.add(region);
  }
  return active;
}


