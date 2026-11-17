import type { MetadataRoute } from 'next';

const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'https://anonify.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /u/ is deliberately left crawlable. Those pages carry robots: noindex, and a
      // crawler blocked here would never read that directive — a disallowed URL can
      // still be indexed from inbound links, which is exactly what we are preventing.
      disallow: ['/api/', '/dashboard', '/verify/', '/reset-password/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
