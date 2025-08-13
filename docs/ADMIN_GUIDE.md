# Admin Guide

## Prereqs
- Slack App (bot user) with scopes: commands, chat:write, channels:read, channels:history, users:read
- Supabase project (URL, anon, service role, pooled Postgres URL)
- OpenAI API key
- Vercel project for deployment

## Environment
Set these in Vercel and `.env` (never commit real values):
- OPENAI_API_KEY
- SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL (pooled Postgres)
- APP_SESSION_SECRET
- PUBLIC_WIDGET_CONFIG_ID (e.g., "demo")

## First-time setup
1) Deploy, then visit `/admin`.
2) Connect Slack via `/api/slack/oauth/start` and select a channel in Admin → Slack.
3) Configure Agents (max 4), Business Hours, Routing Policy.
4) Configure AI: model, system prompt, KB text; test via console.
5) Configure Widget: masking, unified name, auto-open delay/frequency/greeting.
6) Copy embed snippet from Admin → Embed and add to your website.

## Slack App config
- Events URL: `https://<your-domain>/api/slack/events`
- Interactivity URL: `https://<your-domain>/api/slack/interactivity`
- Commands: `/claim`, `/release`, `/closechat` → `https://<your-domain>/api/slack/commands`
- Invite the bot to the selected channel.

## Operations
- Reassignment cron: configured in `vercel.json` hitting `/api/cron/reassign` every 5 minutes.
- Health: `/api/health/realtime`

## Security
- Keep RLS on in Supabase. Anon key in client only; service role server-only.
- Keys stored as envs; never embedded in client bundle.


