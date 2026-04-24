import Link from 'next/link';

/**
 * Floating nav for the home screen and blog shell.
 * The site logo (top-left) already links home, so we only expose "blog".
 */
export function HomeNav({ active = 'home' as 'home' | 'blog' }: { active?: 'home' | 'blog' }) {
  return (
    <nav className="home-nav" aria-label="Primary">
      <Link
        href="/blog"
        className={`blog-nav-link${active === 'blog' ? ' blog-nav-link--active' : ''}`}
      >
        blog
      </Link>
    </nav>
  );
}
