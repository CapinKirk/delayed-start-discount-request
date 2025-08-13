import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';
import { encryptString } from '@/lib/crypto';

const prisma = new PrismaClient();
const Schema = z.object({
  model: z.string().min(1),
  system_prompt: z.string().min(1),
  kb_text: z.string().optional(),
  api_key: z.string().optional(), // plaintext from client; stored encrypted
});

export async function GET(){
  const cfg = await prisma.aIConfig.findFirst();
  // Never return api_key in plaintext
  return NextResponse.json({ ai: cfg ? { ...cfg, api_key_enc: undefined } : null });
}

export async function PUT(req: NextRequest){
  const json = await req.json();
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const toUpdate: any = { model: parsed.data.model, system_prompt: parsed.data.system_prompt, kb_text: parsed.data.kb_text || '' };
  if (parsed.data.api_key && parsed.data.api_key.trim()) {
    toUpdate.api_key_enc = encryptString(parsed.data.api_key.trim());
    // In-memory fallback for environments where DB schema might lag
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (globalThis as any).__AI_KEY_FALLBACK = encryptString(parsed.data.api_key.trim());
  }
  try {
    const ai = await prisma.aIConfig.upsert({ where: { id: 'ai' }, create: { id: 'ai', ...toUpdate }, update: toUpdate });
    return NextResponse.json({ ai: { ...ai, api_key_enc: undefined } });
  } catch (e: any) {
    // Fallback when column api_key_enc hasn't been migrated yet in this environment
    if (toUpdate.api_key_enc) delete toUpdate.api_key_enc;
    const ai = await prisma.aIConfig.upsert({ where: { id: 'ai' }, create: { id: 'ai', ...toUpdate }, update: toUpdate });
    return NextResponse.json({ ai: { ...ai, api_key_enc: undefined }, note: 'saved_without_api_key_enc_column' });
  }
}



