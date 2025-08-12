# Runbook

## Health and Monitoring
- Health: `/api/health/realtime`
- Reassignment cron: see `vercel.json` → `/api/cron/reassign`
- Logs: instrument your hosting to capture Next.js logs; correlate by conversation id

## Slack Issues
- If Events fail: verify signing secret, Events URL, and app scopes
- If Interactivity fails: verify interactivity URL and signature
- If bot not posting: ensure bot user is invited to the channel

## OpenAI Issues
- If streaming fails: check `OPENAI_API_KEY`; endpoint `/api/ai/stream` logs error (without secrets)
- Suppression: conversation.human_suppressed_until controls AI suppression window

## Supabase
- Ensure `SUPABASE_URL` and keys configured; Realtime connectivity required for push events
- RLS must be enabled and policies aligned with your usage

## Rotating Secrets
- Rotate Slack, Supabase, and OpenAI keys in provider dashboards; update Vercel envs; redeploy

