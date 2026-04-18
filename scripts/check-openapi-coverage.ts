import { readFileSync } from 'fs';
import { join } from 'path';
import { globSync } from 'fs';

// Minimal coverage check: compare API route file paths against paths in openapi.yaml.
function apiRoutePaths(): string[] {
  const files = (globSync as unknown as (p: string) => string[])(
    'app/api/**/route.ts',
  );
  return files.map((f: string) =>
    '/' + f.replace(/^app\//, '').replace(/\/route\.ts$/, '')
      .replace(/\[([^/]+)\]/g, '{$1}'),
  );
}

function openapiPaths(): string[] {
  const spec = readFileSync(join(process.cwd(), 'openapi.yaml'), 'utf-8');
  const paths: string[] = [];
  const re = /^  (\/\S+):\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(spec)) != null) paths.push(m[1]);
  return paths;
}

function main() {
  const routes = apiRoutePaths();
  const documented = new Set(openapiPaths());
  const missing = routes.filter((r) => !documented.has(r));
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error('Undocumented API routes:\n' + missing.map((r) => '  - ' + r).join('\n'));
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`✓ All ${routes.length} routes documented.`);
}

main();
