import { Place, Report } from '@/types';

export const INITIAL_SEED_PLACES: Place[] = [];

// In-memory store for fallback/dev execution
class FallbackDataStore {
  private places: Place[] = [...INITIAL_SEED_PLACES];
  private reports: Report[] = [];

  getPlaces(options?: {
    status?: string;
    category?: string;
    price_range?: string;
    q?: string;
    sort?: string;
    userLat?: number;
    userLng?: number;
  }): Place[] {
    let result = [...this.places];

    if (options?.status) {
      if (options.status !== 'all') {
        result = result.filter((p) => p.status === options.status);
      }
    } else {
      // Default public query: only published
      result = result.filter((p) => p.status === 'published');
    }

    if (options?.category && options.category !== 'all') {
      result = result.filter((p) => p.category === options.category);
    }

    if (options?.price_range && options.price_range !== 'all') {
      result = result.filter((p) => p.price_range === options.price_range);
    }

    if (options?.q && options.q.trim()) {
      const q = options.q.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.featured_food.toLowerCase().includes(q) ||
          p.address_text.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sort = options?.sort || 'newest';
    if (sort === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    } else if (sort === 'nearest' && options?.userLat && options?.userLng) {
      result = result.map((p) => ({
        ...p,
        distance_km: calculateDistance(options.userLat!, options.userLng!, p.latitude, p.longitude),
      }));
      result.sort((a, b) => (a.distance_km || 999999) - (b.distance_km || 999999));
    } else {
      // Default: newest
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }

  getPlaceBySlug(slug: string, allowAnyStatus = false): Place | null {
    const place = this.places.find((p) => p.slug === slug);
    if (!place) return null;
    if (!allowAnyStatus && place.status !== 'published') return null;
    return place;
  }

  getPlaceById(id: string): Place | null {
    return this.places.find((p) => p.id === id) || null;
  }

  addPlace(placeData: Omit<Place, 'id' | 'created_at' | 'updated_at'>): Place {
    const newPlace: Place = {
      ...placeData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.places.unshift(newPlace);
    return newPlace;
  }

  updatePlaceStatus(id: string, status: Place['status']): Place | null {
    const place = this.places.find((p) => p.id === id);
    if (!place) return null;
    place.status = status;
    place.updated_at = new Date().toISOString();
    return place;
  }

  deletePlace(id: string): boolean {
    const initialLen = this.places.length;
    this.places = this.places.filter((p) => p.id !== id);
    return this.places.length < initialLen;
  }

  addReport(reportData: { place_id: string; reason: string; description?: string }): Report {
    const place = this.getPlaceById(reportData.place_id);
    const newReport: Report = {
      id: crypto.randomUUID(),
      place_id: reportData.place_id,
      reason: reportData.reason,
      description: reportData.description || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      place: place || undefined,
    };
    this.reports.unshift(newReport);
    return newReport;
  }

  getReports(status?: string): Report[] {
    let result = this.reports.map((r) => ({
      ...r,
      place: this.getPlaceById(r.place_id) || undefined,
    }));
    if (status && status !== 'all') {
      result = result.filter((r) => r.status === status);
    }
    return result;
  }

  updateReportStatus(id: string, status: Report['status']): Report | null {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;
    report.status = status;
    return report;
  }
}

// Global singleton for fallback data store
declare global {
  var __makanguys_fallback_store: FallbackDataStore | undefined;
}

export const fallbackStore = globalThis.__makanguys_fallback_store || new FallbackDataStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__makanguys_fallback_store = fallbackStore;
}

// Calculate Haversine distance in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
