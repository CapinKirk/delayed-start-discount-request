import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.SLACK_CLIENT_ID || "";
  if (!clientId) {
    return NextResponse.json({ error: "missing SLACK_CLIENT_ID" }, { status: 500 });
  }
  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin;
  // Always use request origin to avoid misconfigured NEXT_PUBLIC_BASE_URL in server routes
  const redirectUri = `${origin}/api/slack/oauth/callback`;
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




