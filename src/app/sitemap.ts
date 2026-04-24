import type { MetadataRoute } from 'next';
import { prefetchBlogPosts, prefetchCanonicalBaseUrl } from '@/lib/prefetch';

export const revalidate = 3600;

function resolveUrl(
  seo: { canonical_url?: string | null } | undefined,
  fallback: string,
  base: string,
): string {
  if (seo?.canonical_url) {
    return seo.canonical_url.startsWith('http')
      ? seo.canonical_url
      : `${base}${seo.canonical_url}`;
  }
  return `${base}${fallback}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await prefetchCanonicalBaseUrl();
  const posts = await prefetchBlogPosts();

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/llms-full.txt`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.3,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const published = post.published_at ? new Date(post.published_at) : null;
    const isRecent = published ? published >= threeMonthsAgo : false;
    return {
      url: resolveUrl(post.seo, `/blog/${post.slug}`, baseUrl),
      lastModified: post.last_updated
        ? new Date(post.last_updated)
        : published ?? now,
      changeFrequency: 'monthly' as const,
      priority: isRecent ? 0.9 : 0.7,
    };
  });

  return [...staticPages, ...blogPages];
}
