import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
export const runtime = "nodejs";
import { WebClient } from "@slack/web-api";
import { PrismaClient } from "@/generated/prisma";
import { encryptString } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
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
      const body = new URLSearchParams({ client_id, client_secret, code, redirect_uri });
      const resp = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      });
      const text = await resp.text();
      try { data = JSON.parse(text); } catch { data = null; }
      if (!resp.ok) {
        return NextResponse.json({ error: "slack_exchange_http_error", status: resp.status, body: text.slice(0, 500) }, { status: 502 });
      }
    } catch (e: any) {
      return NextResponse.json({ error: "slack_exchange_failed", message: String(e?.message || e) }, { status: 502 });
    }
    if (!data?.ok) {
      return NextResponse.json({ error: data?.error || "oauth_failed" }, { status: 400 });
    }

    // Extract connection info
    const bot_token: string = data.access_token;
    const team_id: string | undefined = data.team?.id;
    const team_name: string | undefined = data.team?.name;

    // Store encrypted bot token and workspace info when DB present; otherwise keep in-memory fallback for preview
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
      } catch (e: any) {
        // ignore persistence errors in environments without a reachable DB
      } finally {
        await prisma.$disconnect();
      }
    } else if (bot_token && team_id) {
      // In-memory fallback (Preview environments)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      globalThis.__SLACK_CONN_FALLBACK = {
        team_id,
        team_name: team_name || "",
        channel_id: (globalThis as any).__SLACK_CONN_FALLBACK?.channel_id || "",
        bot_token_enc: encryptString(bot_token),
      };
      // Persist preview token and connection in secure cookie so further API calls can read it
      // Redirect response with cookies attached (must set cookies on the response object)
      const redirect = NextResponse.redirect(`${origin}/admin/slack?installed=1`);
      redirect.cookies.set('slack_token_enc', (globalThis as any).__SLACK_CONN_FALLBACK.bot_token_enc, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60*60*24*7 });
      redirect.cookies.set('slack_conn', JSON.stringify({ team_id, team_name, channel_id: (globalThis as any).__SLACK_CONN_FALLBACK.channel_id }), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60*60*24*7 });
      return redirect;
    }

    // Redirect to admin Slack config page (absolute URL)
    return NextResponse.redirect(`${origin}/admin/slack?installed=1`);
  } catch (e: any) {
    return NextResponse.json({ error: "unhandled_error", message: String(e?.message || e) }, { status: 500 });
  }
}



