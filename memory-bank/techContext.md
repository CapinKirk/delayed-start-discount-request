# Technical Context

## Recommended Stack
- **Language/Runtime**: Node.js 20+, TypeScript
- **Framework**: NestJS (modular DI, testing) or Express + modular structure (choose NestJS)
- **Slack**: Bolt for JavaScript, Socket Mode preferred (simpler dev; no public events endpoint required)
- **Realtime**: WebSockets via Socket.IO (fallback to polling if needed)
- **Admin Portal**: Next.js 14 (App Router) + Tailwind; served by same backend or separate
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Queue (optional)**: Redis for pub/sub, rate limits, and background jobs
- **AI**: OpenAI GPT-5 via Responses API with streaming

## Slack App Configuration (minimum)
- Events/Socket Mode: subscribe to `message.channels` (threads), app mentions if used
- Scopes (least-privilege first):
  - `chat:write` (send messages)
  - `channels:history` and/or `groups:history` (read channel messages)
  - `channels:read` (list channels for selection)
  - `users:read` (map Slack IDs/usernames)
  - Consider `commands` if slash commands (e.g., `/end`) are used
- If private channel, bot must be invited; threads use `thread_ts`

## OpenAI Usage
- Model: GPT-5; streaming responses for fast perceived latency
- Prompting: System prompt from admin + conversation history windowing
- Reliability: timeouts, retries, graceful degradation on errors
- Cost control: max tokens, summarization for long threads (future)

## Deployment
- Containerized service (Docker) hosting API, websockets, and optionally admin
- Postgres (managed: Neon/RDS) and Redis (managed) recommended
- Domain: `chat.point-of-rental.com` with TLS; CDN for embed script
- CI/CD: Build, test, typecheck; environment-specific configs

## Security
- Secrets in environment; encrypt sensitive records at rest
- HTTPS/WSS enforced; CORS limited to allowed origins
- Admin auth: local user with strong password policy and session management
- Rate limiting per session and per IP; Slack event signature verification

## Testing & Environments
- Slack dev workspace for staging app
- Integration tests for Slack event → widget relay, and widget → Slack relay
- Load test WebSocket layer; chaos testing for Slack/OpenAI outages
- E2E test of round-robin and timeout reassignment
