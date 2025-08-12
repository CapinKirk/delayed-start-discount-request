# System Patterns

## Architecture at a Glance
- **Web Chat Widget**: Embedded JS; connects to backend via WebSocket/HTTPS; maintains session ID in localStorage.
- **Backend**: Realtime Gateway (WebSocket), Chat Orchestrator (business logic), Agent Router (round-robin), Slack Integration (Bolt SDK), OpenAI Client, Persistence (Postgres), optional Queue/Jobs.
- **Slack**: Single channel; each conversation is a thread (`thread_ts` is the conversation key); Events via Socket Mode or Events API.
- **Admin Portal**: Slack OAuth, agent and hours config, AI prompt and key, widget appearance; embed code generation.

See `memory-bank/diagrams/architecture.mmd` for a visual.

## Primary Data Entities
- **WorkspaceConfig**: workspace metadata, Slack channel ID, business hours, widget theme.
- **SlackAuth**: bot token, app ID, team/workspace, installed by, scopes.
- **Agent**: Slack user ID, display name, active flag, position in rotation.
- **RoutingState**: lastAssignedAgentIndex, per-agent stats (optional).
- **Conversation**: id, sessionId, slackThreadTs, assignedAgentId, status.
- **Message**: id, conversationId, role (user|ai|agent|system), text, timestamps, slackTs, metadata.
- **Attachment**: id, messageId, type, url/meta (future).

## Conversation Status Machine
- `AI_ONLY` → initial state (always responds)
- `ESCALATING` → within hours; assign agent and wait
- `HUMAN_PRIMARY` → first agent reply observed; suppress AI
- `AI_FALLBACK` → agents unavailable/offline or timeout after human handoff
- `CLOSED` → agent/admin ends; future user message creates new conversation

## Routing and Reassignment
- Round-robin through up to 4 agents by defined order.
- On new chat in hours: assign next agent; post: "Assigned to @agent".
- If timeout with no reply: either reassign to next agent (post notice) or keep AI handling.
- Multiple concurrent chats allowed; no strict per-agent cap in v1.

## Slack Threading Contract
- One Slack channel configured (could be private; bot must be invited).
- New conversation: `chat.postMessage` parent in channel → thread `thread_ts` recorded.
- All subsequent messages use `chat.postMessage` with `thread_ts`.
- Mirror: user/AI/agent messages synchronized both directions.

## Idempotency and Reliability
- Idempotency keys on inbound Slack events (event_id) and widget messages (client message id).
- Safe retries with dedupe; store last processed slack `ts` per thread.
- Respect Slack rate limits (HTTP 429) with backoff; queue outbound posts.
- Persist conversation before external calls; reconcile states on recovery.

## Security Patterns
- Encrypt at rest: Slack bot token, OpenAI key (KMS or libsodium).
- Secrets never exposed client-side; admin-only APIs for config.
- HTTPS/WSS everywhere; CSRF for admin; origin checks for widget events.
- Least-privilege scopes; bot invited to private channels explicitly.

## Observability
- Structured logs with correlation IDs (conversationId, thread_ts, sessionId).
- Metrics: message latency, AI latency, assignment success, time-to-first-human.
- Traces across widget → orchestrator → Slack/OpenAI.
- Error alerts for Slack/OpenAI failures and configuration issues.
