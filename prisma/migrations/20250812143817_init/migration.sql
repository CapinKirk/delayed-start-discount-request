-- CreateEnum
CREATE TYPE "public"."RoutingState" AS ENUM ('ai_only', 'pending_agent', 'agent_active');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('user', 'ai', 'agent', 'system');

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SlackConnection" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "bot_token_enc" TEXT NOT NULL,
    "signing_secret_enc" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "takeover_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reaction_claim_emoji" TEXT NOT NULL DEFAULT '✅',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agent" (
    "id" TEXT NOT NULL,
    "slack_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoutingPolicy" (
    "id" TEXT NOT NULL,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "human_suppression_minutes" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "RoutingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessHours" (
    "id" TEXT NOT NULL,
    "tz" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_local_time" TEXT NOT NULL,
    "end_local_time" TEXT NOT NULL,

    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIConfig" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-5',
    "system_prompt" TEXT NOT NULL,
    "kb_text" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WidgetTheme" (
    "id" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "position" TEXT NOT NULL,
    "greeting" TEXT NOT NULL,
    "avatar_url" TEXT,
    "public_id" TEXT NOT NULL,
    "mask_roles" BOOLEAN NOT NULL DEFAULT true,
    "unified_display_name" TEXT NOT NULL DEFAULT 'Support',
    "auto_open_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_open_delay_ms" INTEGER NOT NULL DEFAULT 5000,
    "auto_open_greeting" TEXT NOT NULL DEFAULT '',
    "auto_open_frequency" TEXT NOT NULL DEFAULT 'once_per_session',

    CONSTRAINT "WidgetTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "slack_channel_id" TEXT NOT NULL,
    "slack_thread_ts" TEXT,
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "assigned_agent_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "human_suppressed_until" TIMESTAMP(3),
    "routing_state" "public"."RoutingState" NOT NULL DEFAULT 'ai_only',
    "event_seq" INTEGER NOT NULL DEFAULT 0,
    "controller_message_ts" TEXT,
    "controller_fingerprint" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoundRobinState" (
    "id" TEXT NOT NULL DEFAULT 'state',
    "last_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoundRobinState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "public"."MessageRole" NOT NULL,
    "text" TEXT NOT NULL,
    "slack_ts" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventDedupe" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventDedupe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "public"."AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SlackConnection_team_id_key" ON "public"."SlackConnection"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slack_user_id_key" ON "public"."Agent"("slack_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetTheme_public_id_key" ON "public"."WidgetTheme"("public_id");

-- CreateIndex
CREATE INDEX "Conversation_session_id_idx" ON "public"."Conversation"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventDedupe_event_id_key" ON "public"."EventDedupe"("event_id");

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
