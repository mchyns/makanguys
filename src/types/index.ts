export type PlaceStatus = 'pending' | 'published' | 'rejected' | 'hidden';

export type PriceRange = 'under_15k' | '15k_30k' | '30k_50k' | 'above_50k' | 'unknown';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface PlacePhoto {
  id: string;
  place_id: string;
  storage_path: string;
  alt_text?: string;
  sort_order: number;
  created_at: string;
  url?: string;
}

export interface Place {
  id: string;
  slug: string;
  name: string;
  featured_food: string;
  category: string;
  description: string;
  price_min?: number | null;
  price_max?: number | null;
  price_range: PriceRange;
  address_text: string;
  latitude: number;
  longitude: number;
  contributor_name?: string | null;
  is_anonymous: boolean;
  status: PlaceStatus;
  created_at: string;
  updated_at: string;
  photos?: PlacePhoto[];
  distance_km?: number;
}

export interface Report {
  id: string;
  place_id: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  created_at: string;
  place?: Place;
}

export interface CategoryOption {
  id: string;
  label: string;
  iconName: string;
}

export interface PriceRangeOption {
  id: PriceRange;
  label: string;
  shortLabel: string;
  desc: string;
}

export interface SortOption {
  id: 'newest' | 'oldest' | 'name_asc' | 'nearest';
  label: string;
}
