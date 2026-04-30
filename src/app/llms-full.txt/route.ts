import { NextResponse } from 'next/server';

/**
 * /llms-full.txt is temporarily disabled.
 *
 * The full implementation is preserved in `route.ts.disabled` next to this
 * file — restore it (and re-add the `LLMs-full-txt:` line in
 * `src/app/robots.txt/route.ts`) to bring the route back.
 */
export function GET() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
