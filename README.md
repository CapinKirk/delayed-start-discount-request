# POR Chat (Web Widget + Slack Handoff)

## Quick start

- Requirements: Node 20+, npm, a Supabase project (URL + anon + service keys), pooled Postgres URL, Slack App creds, OpenAI API key
- Copy `ENV.EXAMPLE.txt` to `.env` and fill values
- Install and build:
  - `npm ci`
  - `npx prisma generate`
  - `npm run build`
- Dev: `npm run dev`

## Embed snippet
```
<script src="/embed.js" data-chat-config="PUBLIC_ID" async></script>
```
Configure under Admin → Widget to set `PUBLIC_ID` and masking/auto-open.

## Admin
- Admin pages: `/admin` (links to Slack, Agents, Hours, Routing, AI, Widget, Embed)
- Slack connect: `/api/slack/oauth/start` then set channel in Admin → Slack

## APIs
- Chat: `/api/chat/session`, `/api/chat/send`, `/api/chat/history`, `/api/ai/stream`
- Slack: `/api/slack/events`, `/api/slack/interactivity`, `/api/slack/commands`, `/api/slack/oauth/*`
- Admin: `/api/admin/*` (agents, hours, routing, ai-config, widget-theme, slack/channels, slack/connection)
- Health: `/api/health/realtime`
- OpenAPI JSON: `/api/docs`

## Notes
- Realtime via Supabase channels `conversation_{id}`
- One Slack channel; one thread per conversation (`thread_ts`)
- Masking: unified persona in widget when enabled
- Cron reassignment: `/api/cron/reassign`
