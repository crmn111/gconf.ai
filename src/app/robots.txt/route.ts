import { NextResponse } from 'next/server';
import { prefetchCanonicalBaseUrl } from '@/lib/prefetch';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = await prefetchCanonicalBaseUrl();

  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /_next/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Host: ${baseUrl}`,
    '',
    '# AI content discovery',
    `LLMs-txt: ${baseUrl}/llms.txt`,
    `LLMs-full-txt: ${baseUrl}/llms-full.txt`,
  ].join('\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
