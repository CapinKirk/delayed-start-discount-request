import { execSync } from 'node:child_process';

const candidates = [
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL_NON_POOLING,
];

const url = candidates.find(Boolean);

if (!url) {
  console.error('DATABASE_URL not found and no fallback (POSTGRES_PRISMA_URL/POSTGRES_URL/POSTGRES_URL_NON_POOLING) present.');
  process.exit(1);
}

process.env.DATABASE_URL = url;

execSync('npx prisma generate', { stdio: 'inherit' });
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
execSync('next build', { stdio: 'inherit' });



