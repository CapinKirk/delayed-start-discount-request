import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');

const hasDatabaseUrl = !!process.env.DATABASE_URL;
const fallback = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || '';

if (!hasDatabaseUrl && fallback) {
  let existing = '';
  try { existing = fs.readFileSync(envPath, 'utf8'); } catch {}
  // Append or create .env with DATABASE_URL
  const line = `DATABASE_URL=${fallback}`;
  const content = existing ? `${existing.trim()}\n${line}\n` : `${line}\n`;
  fs.writeFileSync(envPath, content, 'utf8');
  console.log('Wrote DATABASE_URL to .env from fallback');
} else {
  console.log('DATABASE_URL present or no fallback available; no write performed');
}



