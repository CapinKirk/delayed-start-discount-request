# Product Context

## Why This Exists
Provide fast, reliable support on point-of-rental.com with 24/7 AI coverage and human takeover during business hours—without introducing a new agent tool (Slack only).

## Users and Needs
- Website Visitors: quick answers, clear handoff to a person, continuity across pages.
- Support Agents: work entirely in Slack, receive clear assignments, full context.
- Admin: configure Slack, agents, hours, AI prompt, branding, and embed code easily.

## Experience Goals
- **Widget**: lightweight, responsive, persistent sessions, typing indicators, handoff notices.
- **Slack**: single channel with per-chat threads; clear AI vs user vs system messages; assignment mentions.
- **Admin**: minimal setup friction; test console for AI; copy-paste embed snippet.

## Core Flows
1. New chat starts → bot posts parent message in Slack channel → thread hosts all messages.
2. AI answers immediately; messages mirrored into Slack thread.
3. During business hours, round-robin assigns an agent and mentions them.
4. If agent replies, human takes over and AI is suppressed.
5. If no reply within timeout, reassign or continue with AI; configurable timeout (default 30s).
6. Agent marks chat closed → widget session ends; new user message starts a fresh session.

## Edge Cases
- After-hours: AI only; optional email capture (future).
- Slack outages: fall back to AI; inform user.
- OpenAI issues: degrade gracefully; ask user for contact or try again later.
- Agents go offline mid-chat: switch back to AI and notify user.
- Long conversations: cost control via token limits and summarization if needed (future).

## Copy/Content Cues
- Initial notice: "You may be initially assisted by our AI chatbot before a human joins."
- Handoff: "You are now connected with an agent."
- Agent left: "Agent has left, continuing with AI assistant."
- Offline: "Agents are offline; our AI assistant can help you now."
