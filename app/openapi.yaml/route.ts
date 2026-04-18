import { readFileSync } from 'fs';
import { join } from 'path';

export function GET() {
  const spec = readFileSync(join(process.cwd(), 'openapi.yaml'), 'utf-8');
  return new Response(spec, { headers: { 'Content-Type': 'application/yaml' } });
}
