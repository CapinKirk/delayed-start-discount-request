import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';
import { encryptString } from '@/lib/crypto';

export const runtime = 'nodejs';
const prisma = new PrismaClient();
const Schema = z.object({
  model: z.string().default('gpt-5'),
  system_prompt: z.string().optional().default(''),
  kb_text: z.string().optional().default(''),
  api_key: z.string().optional(), // plaintext from client; stored encrypted
});

export async function GET(){
  const cfg = await prisma.aIConfig.findFirst();
  // Never return api_key in plaintext; expose presence only
  return NextResponse.json({ ai: cfg ? { ...cfg, api_key_enc: undefined, has_api_key: !!cfg.api_key_enc } : null });
}

export async function PUT(req: NextRequest){
  const json = await req.json();
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const toUpdate: any = { model: parsed.data.model || 'gpt-5', system_prompt: parsed.data.system_prompt || '', kb_text: parsed.data.kb_text || '' };
  let savedApiKey = false;
  if (parsed.data.api_key && parsed.data.api_key.trim()) {
    toUpdate.api_key_enc = encryptString(parsed.data.api_key.trim());
    // In-memory fallback for environments where DB schema might lag
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (globalThis as any).__AI_KEY_FALLBACK = encryptString(parsed.data.api_key.trim());
    savedApiKey = true;
  }
  try {
    // Avoid upsert to minimize migration edge cases
    const existing = await prisma.aIConfig.findFirst();
    let ai;
    if (!existing) {
      ai = await prisma.aIConfig.create({ data: { id: 'ai', ...toUpdate } });
    } else {
      ai = await prisma.aIConfig.update({ where: { id: existing.id }, data: toUpdate });
    }
    return NextResponse.json({ ai: { ...ai, api_key_enc: undefined }, saved_api_key: savedApiKey });
  } catch (e: any) {
    // Fallback when column api_key_enc hasn't been migrated yet in this environment
    if (toUpdate.api_key_enc) delete toUpdate.api_key_enc;
    const existing = await prisma.aIConfig.findFirst();
    let ai;
    if (!existing) {
      ai = await prisma.aIConfig.create({ data: { id: 'ai', ...toUpdate } });
    } else {
      ai = await prisma.aIConfig.update({ where: { id: existing.id }, data: toUpdate });
    }
    return NextResponse.json({ ai: { ...ai, api_key_enc: undefined }, note: 'saved_without_api_key_enc_column', saved_api_key: false });
  }
}



