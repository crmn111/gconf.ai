import { NextResponse } from 'next/server';
import { prefetchBlogPosts, prefetchCanonicalBaseUrl } from '@/lib/prefetch';
import { cleanText } from '@/lib/structured-data';
import { SEO_DEFAULTS } from '@/lib/seo-defaults';

export const revalidate = 3600;

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function GET() {
  const [posts, baseUrl] = await Promise.all([
    prefetchBlogPosts(),
    prefetchCanonicalBaseUrl(),
  ]);

  const lines: string[] = [];

  // Header
  lines.push(`# ${SEO_DEFAULTS.siteName}`);
  lines.push('');
  lines.push(`> ${SEO_DEFAULTS.defaultDescription}`);
  lines.push('');

  // Key pages
  lines.push('## Key Pages');
  lines.push('');
  lines.push(`- [Home](${baseUrl}): Landing page.`);
  lines.push(`- [Blog](${baseUrl}/blog): Essays, transmissions, and field notes.`);
  lines.push('');

  // Blog articles — most recent first (up to 20 for the short index)
  if (posts.length > 0) {
    lines.push('## Blog');
    lines.push('');
    for (const post of posts.slice(0, 20)) {
      const published = formatDate(post.published_at);
      const desc = post.meta_description
        ? `: ${cleanText(post.meta_description).slice(0, 140)}`
        : '';
      const meta = published ? ` (${published})` : '';
      lines.push(`- [${post.title}](${baseUrl}/blog/${post.slug})${meta}${desc}`);
    }
    if (posts.length > 20) {
      lines.push(
        `- [View all ${posts.length} transmissions](${baseUrl}/blog)`,
      );
    }
    lines.push('');
    lines.push(
      `> Full content for every post lives at [${baseUrl}/llms-full.txt](${baseUrl}/llms-full.txt).`,
    );
    lines.push('');
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
