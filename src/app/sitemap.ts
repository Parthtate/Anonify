import type { MetadataRoute } from 'next';

const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'https://anonify.in';

// Only the pages worth landing on. Inboxes are per-user and noindexed; the verify and
// reset routes are single-use links that are meaningless without their token.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/sign-up`, lastModified, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/sign-in`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/forgot-password`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
