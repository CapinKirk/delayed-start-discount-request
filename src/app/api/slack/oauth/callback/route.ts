import { NextRequest, NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import { PrismaClient } from "@/generated/prisma";
import { encryptString } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const client_id = process.env.SLACK_CLIENT_ID || "";
  const client_secret = process.env.SLACK_CLIENT_SECRET || "";
  if (!client_secret) {
    return NextResponse.json({ error: "missing SLACK_CLIENT_SECRET" }, { status: 500 });
  }
  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin;
  // Always use request origin to match Slack Allowed Redirect URL
  const redirect_uri = `${origin}/api/slack/oauth/callback`;

  let data: any;
  try {
    const resp = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id, client_secret, code, redirect_uri }),
    });
    data = await resp.json();
  } catch {
    return NextResponse.json({ error: "slack_exchange_failed" }, { status: 502 });
  }
  if (!data?.ok) {
    return NextResponse.json({ error: data?.error || "oauth_failed" }, { status: 400 });
  }

  // Extract connection info
  const bot_token: string = data.access_token;
  const team_id: string | undefined = data.team?.id;
  const team_name: string | undefined = data.team?.name;

  // Store encrypted bot token and workspace info when DB present; otherwise skip
  if (process.env.DATABASE_URL && bot_token && team_id) {
    const prisma = new PrismaClient();
    try {
      await prisma.slackConnection.upsert({
        where: { team_id },
        create: {
          team_id,
          team_name: team_name || "",
          bot_token_enc: encryptString(bot_token),
          signing_secret_enc: encryptString(process.env.SLACK_SIGNING_SECRET || ""),
          channel_id: "",
        },
        update: {
          team_name: team_name || "",
          bot_token_enc: encryptString(bot_token),
        },
      });
    } catch {
      // ignore persistence errors in environments without a reachable DB
    } finally {
      await prisma.$disconnect();
    }
  }

  // Redirect to admin Slack config page
  return NextResponse.redirect("/admin/slack?installed=1");
}



