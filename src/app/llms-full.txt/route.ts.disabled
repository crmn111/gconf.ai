import { NextResponse } from 'next/server';
import {
  prefetchBlogPosts,
  prefetchBlogPostBySlug,
  prefetchCanonicalBaseUrl,
} from '@/lib/prefetch';
import { cleanText } from '@/lib/structured-data';
import { SEO_DEFAULTS } from '@/lib/seo-defaults';
import type { BlogContentBlock, BlogPost, BlogPublisher } from '@/lib/api';

export const revalidate = 3600;

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function parseBlocks(raw: string | undefined | null): BlogContentBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (b): b is BlogContentBlock => !!b && typeof b === 'object' && 'type' in b,
      );
    }
  } catch {
    return [
      { id: 'raw-0', type: 'markdown', content: raw, published: true },
    ];
  }
  return [];
}

function blockToText(block: BlogContentBlock): string {
  if (!block || block.published === false) return '';
  if (block.type === 'markdown' && block.content) return cleanText(block.content);
  if (block.type === 'youtube' && block.videoUrl) {
    const title = block.title ? `${block.title}: ` : '';
    return `[video] ${title}${block.videoUrl}`;
  }
  if (block.type === 'tweet' && block.tweetUrl) {
    const title = block.title ? `${block.title}: ` : '';
    return `[tweet] ${title}${block.tweetUrl}`;
  }
  return '';
}

async function buildPostSection(
  post: BlogPost,
  baseUrl: string,
): Promise<string[]> {
  // Fetch full post detail so we have the content blocks.
  const detail = (await prefetchBlogPostBySlug(post.slug)) || post;
  const blocks = parseBlocks(detail.content);
  const lines: string[] = [];

  lines.push(`### ${post.title}`);
  lines.push('');
  lines.push(`- URL: ${baseUrl}/blog/${post.slug}`);
  if (post.published_at) {
    lines.push(`- Published: ${formatDate(post.published_at)}`);
  }
  if (post.reading_time) {
    lines.push(`- Reading time: ${post.reading_time} min`);
  }
  const publisherLine = resolvePublisherLine(detail as BlogPost);
  if (publisherLine) lines.push(publisherLine);
  lines.push('');

  if (post.meta_description) {
    lines.push(cleanText(post.meta_description));
    lines.push('');
  }

  const bodyParts = blocks.map(blockToText).filter(Boolean);
  if (bodyParts.length > 0) {
    lines.push(bodyParts.join('\n\n'));
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  return lines;
}

// Inline lightweight publisher hint — we don't re-fetch members here to
// keep the llms-full generator fast. Detail fetch already includes the
// author_id / editors arrays if the API exposed them.
function resolvePublisherLine(post: BlogPost): string | null {
  const authorIds = post.author_id ? [post.author_id] : [];
  const editorIds = post.editors || [];
  if (authorIds.length === 0 && editorIds.length === 0) return null;
  const bits: string[] = [];
  if (authorIds.length > 0) bits.push(`author: ${authorIds.join(', ')}`);
  if (editorIds.length > 0) bits.push(`editors: ${editorIds.join(', ')}`);
  return `- Bylines: ${bits.join(' · ')}`;
}

// Keep the signature of the unused param for future wiring.
void ({} as BlogPublisher);

export async function GET() {
  const [posts, baseUrl] = await Promise.all([
    prefetchBlogPosts(),
    prefetchCanonicalBaseUrl(),
  ]);

  const lines: string[] = [];
  lines.push(`# ${SEO_DEFAULTS.siteName} — full transmissions`);
  lines.push('');
  lines.push(`> ${SEO_DEFAULTS.defaultDescription}`);
  lines.push('');
  lines.push(
    '> This file contains the full text of every published blog post. For a lightweight index, see [llms.txt](' +
      baseUrl +
      '/llms.txt).',
  );
  lines.push('');

  if (posts.length === 0) {
    lines.push('## Blog');
    lines.push('');
    lines.push('_No published posts yet._');
    return respond(lines.join('\n'));
  }

  lines.push('## Blog');
  lines.push('');

  // Build each post section sequentially so detail fetches don't fan out in
  // a way that would stress the upstream API.
  for (const post of posts) {
    const sectionLines = await buildPostSection(post, baseUrl);
    lines.push(...sectionLines);
  }

  return respond(lines.join('\n'));
}

function respond(body: string) {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
