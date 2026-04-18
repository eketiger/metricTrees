export function GET() {
  return Response.json({ status: 'ok', version: process.env.GIT_SHA ?? 'dev' });
}
