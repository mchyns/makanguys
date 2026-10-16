-- MakanGuys Database Schema Migration
-- Designed for Supabase PostgreSQL with RLS and Storage Policies

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Places Table
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    featured_food TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price_min INTEGER,
    price_max INTEGER,
    price_range TEXT NOT NULL DEFAULT 'unknown' 
        CHECK (price_range IN ('under_15k', '15k_30k', '30k_50k', 'above_50k', 'unknown')),
    address_text TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    contributor_name TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published' 
        CHECK (status IN ('pending', 'published', 'rejected', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_lat CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_lng CHECK (longitude >= -180 AND longitude <= 180)
);

-- 3. Place Photos Table
CREATE TABLE IF NOT EXISTS public.place_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Indexes for fast discovery queries
CREATE INDEX IF NOT EXISTS idx_places_status ON public.places(status);
CREATE INDEX IF NOT EXISTS idx_places_slug ON public.places(slug);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_places_created_at ON public.places(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_coords ON public.places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_place_photos_place_id ON public.place_photos(place_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 6. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_places_updated_at ON public.places;
CREATE TRIGGER trigger_places_updated_at
    BEFORE UPDATE ON public.places
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Row Level Security (RLS)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published places
DROP POLICY IF EXISTS "Public can view published places" ON public.places;
CREATE POLICY "Public can view published places"
    ON public.places FOR SELECT
    USING (status = 'published');

-- Policy: Anyone can submit new places (auto-published directly)
DROP POLICY IF EXISTS "Public can submit places" ON public.places;
CREATE POLICY "Public can submit places"
    ON public.places FOR INSERT
    WITH CHECK (status = 'published');

-- Policy: Anyone can view photos belonging to published places
DROP POLICY IF EXISTS "Public can view photos of published places" ON public.place_photos;
CREATE POLICY "Public can view photos of published places"
    ON public.place_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.places 
            WHERE public.places.id = public.place_photos.place_id 
            AND public.places.status = 'published'
        )
    );

-- Policy: Public can insert photos for places
DROP POLICY IF EXISTS "Public can insert place photos" ON public.place_photos;
CREATE POLICY "Public can insert place photos"
    ON public.place_photos FOR INSERT
    WITH CHECK (true);

-- Policy: Public can insert reports
DROP POLICY IF EXISTS "Public can submit reports" ON public.reports;
CREATE POLICY "Public can submit reports"
    ON public.reports FOR INSERT
    WITH CHECK (status = 'pending');

-- 8. Storage bucket setup instructions (Execute in Supabase Storage SQL editor or API)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'place-photos', 
    'place-photos', 
    true, 
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Public read access for photos
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
CREATE POLICY "Public read photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'place-photos');

-- Storage RLS: Anyone can upload photos to place-photos
DROP POLICY IF EXISTS "Public upload photos" ON storage.objects;
CREATE POLICY "Public upload photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'place-photos' 
        AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp')
    );
