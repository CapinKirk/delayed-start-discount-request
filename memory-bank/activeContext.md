# Active Context

## Current Focus
- Establish Memory Bank and baseline architecture for Slack-threaded chat with AI-first responses and human takeover.
- Decide on stack: Node.js + TypeScript, NestJS, Bolt (Socket Mode), Socket.IO, Postgres+Prisma, Next.js admin.

## Key Decisions
- Use a single Slack channel with per-conversation threads; store `thread_ts` on conversation.
- Prefer Slack Socket Mode to simplify dev and avoid public events endpoint.
- Round-robin with configurable timeout (default 30s); suppress AI after first agent reply.

## Next Steps
- [ ] Scaffold backend (NestJS) with modules: Auth (admin), Slack, Chat, AI, Routing, Realtime, Config, Prisma
- [ ] Initialize DB schema (Prisma): WorkspaceConfig, SlackAuth, Agent, RoutingState, Conversation, Message
- [ ] Implement Slack OAuth flow; store encrypted bot token and channel selection
- [ ] Implement embed script endpoint and minimal widget client (connects via WebSocket)
- [ ] Implement AI response pipeline with streaming
- [ ] Implement Slack thread creation and two-way sync
- [ ] Implement round-robin assignment with timeout and reassignment
- [ ] Build admin UI (Next.js) for config, AI test console, and widget appearance preview
- [ ] Add observability, rate limits, and error handling

## Risks/Considerations
- Slack rate limits under burst load → enqueue and backoff
- Streaming response UX in widget and mirroring to Slack thread
- Secret management and encryption at rest for tokens/keys
