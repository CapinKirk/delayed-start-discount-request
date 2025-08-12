import { NextRequest, NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import { PrismaClient } from "@/generated/prisma";
import { encryptString } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const client_id = process.env.SLACK_CLIENT_ID || "";
  const client_secret = process.env.SLACK_CLIENT_SECRET || "";
  const redirect_uri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/slack/oauth/callback`;

  const resp = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id, client_secret, code, redirect_uri }),
  });
  const data = await resp.json();
  if (!data.ok) {
    return NextResponse.json({ error: data.error || "oauth_failed" }, { status: 400 });
  }

  // Extract connection info
  const bot_token: string = data.access_token;
  const team_id: string = data.team?.id;
  const team_name: string = data.team?.name;

  // Store encrypted bot token and workspace info
  const prisma = new PrismaClient();
  try {
    await prisma.slackConnection.upsert({
      where: { team_id },
      create: {
        team_id,
        team_name,
        bot_token_enc: encryptString(bot_token),
        signing_secret_enc: encryptString(process.env.SLACK_SIGNING_SECRET || ""),
        channel_id: "",
      },
      update: {
        team_name,
        bot_token_enc: encryptString(bot_token),
      },
    });
  } finally {
    await prisma.$disconnect();
  }

  // Redirect to admin Slack config page
  return NextResponse.redirect("/admin/slack");
}



