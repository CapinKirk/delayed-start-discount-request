# Chatbot Slack Integration — Project Brief

## Overview
A web chat widget for point-of-rental.com that provides AI-first responses (GPT-5) with seamless handoff to human agents via Slack (thread-based in a single channel), managed from a secure admin portal.

## Objectives
- Deliver instant, high-quality AI responses 24/7.
- Handoff to human agents during business hours using Slack only (no separate agent UI).
- Keep full bidirectional sync between website chat and Slack threads.
- Provide an admin portal for Slack OAuth, agent routing, business hours, AI setup, and widget customization.

## In Scope
- Slack App + Bot user, OAuth 2.0 install to workspace.
- Thread-based conversation handling in a single Slack channel.
- Two-way relay between web widget and Slack (AI and human messages).
- Round-robin routing to up to 4 agents with configurable timeout.
- AI via OpenAI GPT-5 with configurable base prompt/knowledge.
- Admin portal: Slack connection, agent list, business hours, AI config, widget appearance, embed code.
- Persistent sessions across page navigations.
- Basic message formatting and links; files deferred.
- Security: token encryption, HTTPS/WSS, least-privilege Slack scopes.

## Out of Scope (Phase 1)
- File uploads in widget or Slack-to-user attachments (future).
- Multi-workspace, multi-tenant beyond a single workspace (future-ready design only).
- Advanced analytics dashboards (basic logs allowed).
- Complex RBAC in admin (single admin for now).
- Full knowledge base ingestion/vector search (prompt-only initial).

## Success Criteria
- <2s perceived latency for AI responses using streaming where possible.
- Seamless real-time sync between widget and Slack threads.
- Correct round-robin assignment and reassignment on timeout.
- Clear user indicators on AI vs human, handoff, and agent status.
- Secure storage of OAuth tokens and API keys; no secrets leak to client.
- Simple embed code works across site pages with persistent sessions.

## Key Constraints & Assumptions
- Slack threading in a single channel is preferred to reduce channel clutter.
- Admin portal is single-user (admin/admin default) with enforced password change.
- Business-hours schedule determines human availability; manual override toggle optional.
- OpenAI GPT-5 used with rate-limit/error handling and cost controls.
- Backend maintains authoritative conversation state and mapping to Slack `thread_ts`.

## Stakeholders
- Website visitors (end users)
- Support agents (Slack users)
- Admin (configuration owner)
- Engineering/Operations (maintenance, reliability)

## High-Level Milestones
1. Slack app + OAuth + basic bot posting to channel threads
2. Web widget MVP with real-time back-end and AI responses
3. Two-way Slack↔web sync and session persistence
4. Agent routing (round-robin) + timeout + reassignment
5. Admin portal (Slack connect, agents, hours, AI, widget)
6. Hardening: security, observability, error handling
7. Beta in Slack dev workspace; production rollout
