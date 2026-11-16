import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The original Anonify mark — the calligraphic "A", recovered from the project's
 * favicon, which is the only artwork that exists for it.
 *
 * The glyph is solid black on transparency, so on a dark background it is inverted
 * to read as cream rather than disappearing. Source is 32x32 (the favicon's native
 * size), so it is rendered small; anything larger will look soft.
 */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      priority
      className={cn('h-7 w-7 object-contain', light && 'brightness-0 invert', className)}
    />
  );
}
