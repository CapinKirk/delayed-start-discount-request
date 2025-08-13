import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@/generated/prisma';
import { decryptString } from './crypto';

const prisma = new PrismaClient();

export type ControllerState = {
  routing_state: 'ai_only' | 'pending_agent' | 'agent_active';
  owner_slack_user_id: string | null;
};

export function buildControllerBlocks(state: ControllerState) {
  const statusText = state.routing_state === 'agent_active'
    ? `Agent active`
    : state.routing_state === 'pending_agent'
    ? `Waiting for agent`
    : `AI only`;
  const owner = state.owner_slack_user_id ? `<@${state.owner_slack_user_id}>` : '—';
  const blocks: any[] = [
    { type: 'section', text: { type: 'mrkdwn', text: `*Status:* ${statusText}  |  *Owner:* ${owner}` } },
    {
      type: 'actions', elements: [
        { type: 'button', text: { type: 'plain_text', text: 'Take chat' }, action_id: 'take_chat', style: 'primary' },
        { type: 'button', text: { type: 'plain_text', text: 'Release' }, action_id: 'release_chat' },
        { type: 'button', text: { type: 'plain_text', text: 'Close' }, action_id: 'close_chat', style: 'danger' },
      ]
    }
  ];
  return blocks;
}

export function fingerprintController(state: ControllerState): string {
  return `${state.routing_state}|${state.owner_slack_user_id ?? ''}`;
}

export async function postOrUpdateController(thread_ts: string, state: ControllerState): Promise<void> {
  const conn = await prisma.slackConnection.findFirst();
  if (!conn) return;
  const client = new WebClient(decryptString(conn.bot_token_enc));
  const convo = await prisma.conversation.findFirst({ where: { slack_thread_ts: thread_ts } });
  if (!convo) return;
  const fp = fingerprintController(state);
  if (convo.controller_fingerprint === fp && convo.controller_message_ts) return; // no change
  if (!convo.controller_message_ts) {
    const res = await client.chat.postMessage({ channel: conn.channel_id, thread_ts, text: 'Controller', blocks: buildControllerBlocks(state) as any });
    await prisma.conversation.update({ where: { id: convo.id }, data: { controller_message_ts: String(res.ts || ''), controller_fingerprint: fp } });
  } else {
    await client.chat.update({ channel: conn.channel_id, ts: convo.controller_message_ts, text: 'Controller', blocks: buildControllerBlocks(state) as any });
    await prisma.conversation.update({ where: { id: convo.id }, data: { controller_fingerprint: fp } });
  }
}




