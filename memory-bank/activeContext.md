# Active Context

## Current Focus
- Baseline API and libs in place (chat session, send, history, AI stream, Slack OAuth/events/commands/interactivity, admin endpoints, cron reassignment).
- Web widget MVP present (`public/embed.js`) with Supabase realtime integration and auto-open behavior.
- Ensure correctness of agent assignment semantics and Slack mentions.

## Key Decisions
- Use a single Slack channel with per-conversation threads; store `thread_ts` on conversation.
- Prefer Slack Socket Mode to simplify dev and avoid public events endpoint. (Events API endpoints are implemented for flexibility.)
- Round-robin with configurable timeout (default 30s); suppress AI after first agent reply.
- Conversation `assigned_agent_id` stores the Slack user ID (not internal agent row ID) for consistency with Slack events and mentions.

## Next Steps
- [ ] Provision Postgres and Supabase env; set `.env` from `ENV.EXAMPLE.txt` (uses `POSTGRES_PRISMA_URL`).
- [ ] Run Prisma migrations and seed minimal config (theme, routing policy).
- [ ] End-to-end test Slack OAuth flow and set channel; confirm parent/thread posting works.
- [ ] Verify realtime end-to-end: user send → AI stream → Slack mirror; agent reply → widget mirror and AI suppression.
- [ ] Harden time zone handling in business hours evaluation.
- [ ] Add observability, rate limits, and error handling.

## Risks/Considerations
- Slack rate limits under burst load → enqueue and backoff
- Streaming response UX in widget and mirroring to Slack thread
- Secret management and encryption at rest for tokens/keys
- `evaluateHours` currently ignores per-row time zones; needs tz-aware evaluation.
