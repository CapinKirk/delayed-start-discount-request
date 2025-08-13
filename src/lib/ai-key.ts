import { decryptString } from './crypto';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

function decodeBase64(input: string | undefined): string | undefined {
  if (!input) return undefined;
  try { return Buffer.from(input, 'base64').toString('utf8'); } catch { return undefined; }
}

export async function getOpenAIKey(): Promise<string | undefined> {
  // 1) DB-configured encrypted key
  try {
    const ai = await prisma.aIConfig.findFirst();
    if (ai?.api_key_enc) {
      try { return decryptString(ai.api_key_enc); } catch {}
    }
  } catch {}
  // 2) Environment variable
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) return process.env.OPENAI_API_KEY.trim();
  // 3) Base64 environment fallback
  const envB64 = process.env.OPENAI_FALLBACK_B64;
  const envDecoded = decodeBase64(envB64);
  if (envDecoded && envDecoded.startsWith('sk-')) return envDecoded;
  return undefined;
}


