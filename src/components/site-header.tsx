import Link from 'next/link';
import { Logo } from '@/components/logo';

/**
 * Shared class strings for controls placed inside the header. The bar is dark, so
 * every button has to invert — keeping these here stops the four call sites drifting
 * apart, and stops anyone reaching for the default dark-on-light button styles.
 */
export const headerGhostClass =
  'text-paper/90 hover:bg-white/15 hover:text-paper focus-visible:ring-paper';
export const headerPrimaryClass =
  'bg-paper text-olive hover:bg-white hover:text-olive focus-visible:ring-paper';
export const headerOutlineClass =
  'border-paper/40 bg-transparent text-paper hover:bg-white/15 hover:text-paper focus-visible:ring-paper';

type SiteHeaderProps = {
  /** Where the wordmark points — the dashboard for signed-in areas, home otherwise. */
  homeHref?: string;
  children?: React.ReactNode;
};

export function SiteHeader({ homeHref = '/', children }: SiteHeaderProps) {
  return (
    <header className="bg-olive">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href={homeHref}
          aria-label="Anonify home"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-olive"
        >
          {/* Kept in its original black rather than inverted to cream. */}
          <Logo />
          <span className="font-display text-xl font-bold tracking-wide text-paper">ANONIFY</span>
        </Link>
        {children && <nav className="flex items-center gap-1 sm:gap-2">{children}</nav>}
      </div>
    </header>
  );
}
