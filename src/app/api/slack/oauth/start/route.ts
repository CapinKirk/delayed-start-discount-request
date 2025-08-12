import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const FALLBACK_CLIENT_ID = "215343527091.9352285443297"; // used only if env is missing
  const clientId = process.env.SLACK_CLIENT_ID || FALLBACK_CLIENT_ID;
  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || origin}/api/slack/oauth/callback`;
  const scope = [
    "chat:write",
    "channels:history",
    "channels:read",
    "users:read",
  ].join(",");
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId || "");
  url.searchParams.set("scope", scope);
  url.searchParams.set("redirect_uri", redirectUri);
  return NextResponse.redirect(url.toString());
}




