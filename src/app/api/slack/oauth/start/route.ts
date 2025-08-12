import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/slack/oauth/callback`;
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




