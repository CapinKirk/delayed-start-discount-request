import fs from 'node:fs';
import path from 'node:path';

async function main(){
  const res = await fetch('http://127.0.0.1:3000/api/docs');
  if (!res.ok) {
    console.error('Failed to fetch OpenAPI from /api/docs');
    process.exit(1);
  }
  const spec = await res.json();
  const outDir = path.join(process.cwd(), 'openapi');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2));
  console.log('OpenAPI written to openapi/openapi.json');
}

main().catch((e)=>{ console.error(e); process.exit(1); });

