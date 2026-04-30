import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  prefetchAllGalleryPhotos,
  prefetchBlogDetailPageData,
  prefetchCanonicalBaseUrl,
} from '@/lib/prefetch';
import { SEO_DEFAULTS, absoluteUrl } from '@/lib/seo-defaults';
import {
  generateBlogPostingGraph,
} from '@/lib/structured-data';
import type { BlogContentBlock, BlogPost, GalleryPhoto } from '@/lib/api';
import { BlogDetail } from './BlogDetail';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ post }, baseUrl] = await Promise.all([
    prefetchBlogDetailPageData(slug),
    prefetchCanonicalBaseUrl(),
  ]);
  if (!post) return { title: `Not found · ${SEO_DEFAULTS.siteName}` };

  const seo = post.seo || null;
  const title =
    seo?.meta_title ||
    post.meta_title ||
    (post.title
      ? `${post.title} · ${SEO_DEFAULTS.siteName}`
      : SEO_DEFAULTS.defaultTitle);
  const description =
    seo?.meta_description ||
    post.meta_description ||
    SEO_DEFAULTS.defaultDescription;
  const ogTitle = seo?.og_title || title;
  const ogDescription = seo?.og_description || description;
  const ogImage =
    absoluteUrl(seo?.og_image || post.featured_image, baseUrl) ||
    absoluteUrl(SEO_DEFAULTS.defaultImage, baseUrl) ||
    undefined;
  const canonical = seo?.canonical_url || `${baseUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: seo?.meta_keywords || undefined,
    robots: seo?.robots_tag?.toLowerCase() || SEO_DEFAULTS.defaultRobots,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      siteName: SEO_DEFAULTS.siteName,
      ...(ogImage && { images: [{ url: ogImage, alt: post.title }] }),
      ...(post.published_at && { publishedTime: post.published_at }),
      ...(post.last_updated && { modifiedTime: post.last_updated }),
    },
    twitter: {
      card: SEO_DEFAULTS.twitterCard,
      title: ogTitle,
      description: ogDescription,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

function parseContentBlocks(raw: string | undefined | null): BlogContentBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (b): b is BlogContentBlock => !!b && typeof b === 'object' && 'type' in b,
      );
    }
  } catch {
    // Not JSON — treat the whole string as a single markdown block.
    return [
      { id: 'raw-0', type: 'markdown', content: raw, published: true },
    ];
  }
  return [];
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const [{ post, publishers }, baseUrl] = await Promise.all([
    prefetchBlogDetailPageData(slug),
    prefetchCanonicalBaseUrl(),
  ]);

  if (!post) notFound();
  const blogPost = post as BlogPost;

  // One combined Schema.org @graph covering Organization, WebSite, WebPage,
  // BlogPosting, Person (author), ImageObject (featured image) and the
  // BreadcrumbList — all cross-referenced via @id. Single <script> tag, no
  // duplication. CMS overrides on `seo.structured_data` are merged into the
  // BlogPosting node.
  const baseGraph = generateBlogPostingGraph({
    post: blogPost,
    publishers,
    baseUrl,
    breadcrumb: [
      { name: 'Home', url: baseUrl || '/' },
      { name: 'Blog', url: `${baseUrl}/blog` },
      { name: blogPost.title },
    ],
  });
  const overrides = (blogPost.seo?.structured_data || {}) as Record<string, unknown>;
  const blogGraph = Object.keys(overrides).length > 0
    ? {
        ...baseGraph,
        '@graph': baseGraph['@graph'].map((node) =>
          (node as { '@type'?: string })['@type'] === 'BlogPosting'
            ? { ...node, ...overrides }
            : node,
        ),
      }
    : baseGraph;

  const blocks = parseContentBlocks(blogPost.content).filter(
    (b) => b.published !== false,
  );

  // Only fetch gallery/carousel photos if the post actually references them.
  const needsPhotos = blocks.some(
    (b) =>
      (b.type === 'gallery' && b.galleryId) ||
      (b.type === 'carousel' && b.carouselId),
  );
  const galleryPhotos: Record<string, GalleryPhoto[]> = {};
  const carouselPhotos: Record<string, GalleryPhoto[]> = {};
  if (needsPhotos) {
    const allPhotos = await prefetchAllGalleryPhotos();
    for (const block of blocks) {
      if (block.type === 'gallery' && block.galleryId) {
        galleryPhotos[block.galleryId] = allPhotos.filter(
          (p) => p.gallery_id === block.galleryId,
        );
      }
      if (block.type === 'carousel' && block.carouselId) {
        carouselPhotos[block.carouselId] = allPhotos.filter(
          (p) => p.carousel_id === block.carouselId,
        );
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogGraph) }}
      />
      <BlogDetail
        post={blogPost}
        blocks={blocks}
        publishers={publishers}
        galleryPhotos={galleryPhotos}
        carouselPhotos={carouselPhotos}
      />
    </>
  );
}
