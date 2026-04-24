import type { Metadata } from 'next';
import { prefetchBlogPosts, prefetchCanonicalBaseUrl } from '@/lib/prefetch';
import { generatePageMetadata } from '@/lib/seo-defaults';
import { generateBreadcrumbSchema, generateWebsiteSchema } from '@/lib/structured-data';
import { BlogListing } from './BlogListing';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await prefetchCanonicalBaseUrl();
  return generatePageMetadata(null, 'blog', baseUrl);
}

export default async function BlogPage() {
  const [posts, baseUrl] = await Promise.all([
    prefetchBlogPosts(),
    prefetchCanonicalBaseUrl(),
  ]);

  const websiteSchema = generateWebsiteSchema(baseUrl);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl || '/' },
    { name: 'Blog', url: `${baseUrl}/blog` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogListing posts={posts} />
    </>
  );
}
