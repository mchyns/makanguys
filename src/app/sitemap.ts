import { MetadataRoute } from 'next';
import { fallbackStore } from '@/lib/supabase/fallback-data';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://makanguys.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tersimpan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let publishedPlaces: { slug: string; updated_at: string }[] = [];

  if (isServerSupabaseConfigured) {
    try {
      const supabase = createServerClient()!;
      const { data } = await supabase
        .from('places')
        .select('slug, updated_at')
        .eq('status', 'published');
      if (data) publishedPlaces = data;
    } catch {
      publishedPlaces = fallbackStore.getPlaces().map((p) => ({
        slug: p.slug,
        updated_at: p.updated_at,
      }));
    }
  } else {
    publishedPlaces = fallbackStore.getPlaces().map((p) => ({
      slug: p.slug,
      updated_at: p.updated_at,
    }));
  }

  const placeRoutes: MetadataRoute.Sitemap = publishedPlaces.map((place) => ({
    url: `${baseUrl}/tempat/${place.slug}`,
    lastModified: new Date(place.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...placeRoutes];
}
