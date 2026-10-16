import { NextRequest, NextResponse } from 'next/server';

// Lightweight in-memory cache to prevent spamming Nominatim when pin is dragged slightly
const geocodeCache = new Map<string, { formatted: string; road: string; district: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'Parameter lat dan lng wajib disertakan' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Koordinat tidak valid' }, { status: 400 });
    }

    // Cache key rounded to ~4 decimal places (~11 meters resolution)
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        ...cached,
        fromCache: true,
      });
    }

    // Fetch from OpenStreetMap Nominatim reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=id`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MakanGuys-App/1.0 (https://makanguys.vercel.app)',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};

    // Extract road / street
    const road =
      addr.road ||
      addr.pedestrian ||
      addr.street ||
      addr.path ||
      addr.footway ||
      addr.residential ||
      addr.neighbourhood ||
      '';

    // Extract district / subdistrict
    const districtParts: string[] = [];
    if (addr.village && addr.village !== road) districtParts.push(addr.village);
    if (addr.suburb && !districtParts.includes(addr.suburb)) districtParts.push(addr.suburb);
    if (addr.city_district && !districtParts.includes(addr.city_district)) districtParts.push(addr.city_district);
    if (addr.city && !districtParts.includes(addr.city)) districtParts.push(addr.city);
    else if (addr.county && !districtParts.includes(addr.county)) districtParts.push(addr.county);

    const district = districtParts.slice(0, 2).join(', ');

    // Format clean Indonesian road label
    let formatted = '';
    if (road && district) {
      formatted = `${road}, ${district}`;
    } else if (road) {
      formatted = road;
    } else if (district) {
      formatted = district;
    } else if (data.name) {
      formatted = data.name;
    } else {
      formatted = `Area sekitar (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }

    const result = {
      formatted,
      road: road || formatted,
      district: district || '',
    };

    // Store in cache
    geocodeCache.set(cacheKey, {
      ...result,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      ...result,
      fromCache: false,
    });
  } catch (err: any) {
    console.error('Reverse geocode error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mendeteksi jalan sekitar',
        formatted: '',
        road: '',
        district: '',
      },
      { status: 500 }
    );
  }
}
