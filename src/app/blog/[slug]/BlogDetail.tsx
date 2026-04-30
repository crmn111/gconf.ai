import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type {
  BlogContentBlock,
  BlogPost,
  BlogPublisher,
  GalleryPhoto,
} from '@/lib/api';
import { BlogShell } from '../BlogShell';
import { BlogCarousel } from './BlogCarousel';
import { BlogGallery } from './BlogGallery';
import { BlogTweet } from './BlogTweet';
import BlogLottie from './BlogLottie';

// Enable inline HTML (e.g. <sup>, <sub>, <kbd>) in markdown content.
// Content comes from the tenant's trusted CMS editors.
const REHYPE_PLUGINS = [rehypeRaw];

// The ep-dashboard rich-text editor stores HTML-entity-encoded content (it
// persists `<sup>` as `&lt;sup&gt;` in the block's `content` field). Decode
// the common entities back to raw characters so rehype-raw can parse the
// resulting tags. Idempotent for already-raw content.
const HTML_ENTITY_RE = /&(lt|gt|amp|quot|#39|apos|nbsp);/g;
const HTML_ENTITY_MAP: Record<string, string> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
};
function decodeEntities(input: string): string {
  return input.replace(HTML_ENTITY_RE, (_, key: string) => HTML_ENTITY_MAP[key] ?? _);
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getYouTubeEmbedUrl(url: string): string {
  if (url.includes('/embed/')) return url;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url.replace('watch?v=', 'embed/');
}

interface BlockRendererProps {
  block: BlogContentBlock;
  galleryPhotos: Record<string, GalleryPhoto[]>;
  carouselPhotos: Record<string, GalleryPhoto[]>;
}

function BlockRenderer({
  block,
  galleryPhotos = {},
  carouselPhotos = {},
}: BlockRendererProps) {
  if (block.type === 'markdown' && block.content) {
    return (
      <div className="gconf-article">
        <ReactMarkdown rehypePlugins={REHYPE_PLUGINS}>
          {decodeEntities(block.content)}
        </ReactMarkdown>
      </div>
    );
  }
  if (block.type === 'youtube' && block.videoUrl) {
    return (
      <figure className="blog-embed blog-embed--video">
        {block.title ? <figcaption>{block.title}</figcaption> : null}
        <div className="blog-embed-frame">
          <iframe
            src={getYouTubeEmbedUrl(block.videoUrl)}
            title={block.title || 'Embedded video'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </figure>
    );
  }
  if (block.type === 'tweet' && block.tweetUrl) {
    return <BlogTweet tweetUrl={block.tweetUrl} title={block.title} />;
  }
  if (block.type === 'lottie' && block.animationData) {
    return (
      <BlogLottie
        animationData={block.animationData}
        title={block.title}
        loop={block.loop !== false}
        autoplay={block.autoplay !== false}
        width={block.width}
        widthCss={block.widthCss}
        alignment={block.alignment}
        textColor={block.textColor}
        fontFamily={block.fontFamily}
      />
    );
  }
  if (block.type === 'gallery' && block.galleryId) {
    const photos = galleryPhotos[block.galleryId] ?? [];
    if (photos.length === 0) return null;
    return <BlogGallery photos={photos} title={block.title} />;
  }
  if (block.type === 'carousel' && block.carouselId) {
    const photos = carouselPhotos[block.carouselId] ?? [];
    if (photos.length === 0) return null;
    return <BlogCarousel photos={photos} title={block.title} />;
  }
  return null;
}

interface BlogDetailProps {
  post: BlogPost;
  blocks: BlogContentBlock[];
  publishers: BlogPublisher[];
  galleryPhotos: Record<string, GalleryPhoto[]>;
  carouselPhotos: Record<string, GalleryPhoto[]>;
}

export function BlogDetail({
  post,
  blocks,
  publishers,
  galleryPhotos,
  carouselPhotos,
}: BlogDetailProps) {
  const author = publishers.find((p) => p.role === 'author');
  const editors = publishers.filter((p) => p.role === 'editor');

  return (
    <BlogShell>
      <article className="blog-article-wrap">
        <div className="blog-article-meta">
          <Link href="/blog" className="blog-back-link">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M19 12H5M11 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            transmissions
          </Link>
          <div className="blog-article-meta-row">
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            {post.reading_time ? (
              <>
                <span className="blog-card-dot" aria-hidden>
                  ·
                </span>
                <span>{post.reading_time} min read</span>
              </>
            ) : null}
          </div>
        </div>

        <header className="blog-article-header">
          <h1 className="blog-article-title">{post.title}</h1>
          {post.meta_description ? (
            <p className="blog-article-lede">{post.meta_description}</p>
          ) : null}
          {(author || editors.length > 0) && (
            <div className="blog-byline">
              {author ? (
                <span className="blog-byline-entry">
                  <span className="blog-byline-label">by</span>
                  <span className="blog-byline-name">{author.name}</span>
                </span>
              ) : null}
              {editors.length > 0 ? (
                <span className="blog-byline-entry">
                  <span className="blog-byline-label">edited by</span>
                  <span className="blog-byline-name">
                    {editors.map((e) => e.name).join(', ')}
                  </span>
                </span>
              ) : null}
            </div>
          )}
        </header>

        {post.featured_image ? (
          <figure className="blog-article-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.featured_image} alt={post.title} loading="eager" />
          </figure>
        ) : null}

        <div className="blog-article-body">
          {blocks.length > 0 ? (
            blocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                galleryPhotos={galleryPhotos}
                carouselPhotos={carouselPhotos}
              />
            ))
          ) : post.meta_description ? (
            <div className="gconf-article">
              <p>{post.meta_description}</p>
            </div>
          ) : (
            <div className="blog-empty-inline">
              <span className="blog-empty-cursor">_</span> no content yet.
            </div>
          )}
        </div>

        <footer className="blog-article-footer">
          <Link href="/blog" className="blog-back-link">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M19 12H5M11 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            back to all transmissions
          </Link>
        </footer>
      </article>
    </BlogShell>
  );
}
