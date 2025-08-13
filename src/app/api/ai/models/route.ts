import { NextResponse } from 'next/server';

// Simple hardcoded set + env override for allowed models
const DEFAULT_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o3-mini'];

export async function GET(){
  const extra = (process.env.ALLOWED_OPENAI_MODELS || '').split(',').map(s=>s.trim()).filter(Boolean);
  const models = Array.from(new Set([...DEFAULT_MODELS, ...extra]));
  return NextResponse.json({ models });
}


