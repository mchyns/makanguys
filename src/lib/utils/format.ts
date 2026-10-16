import { PRICE_RANGES } from '../constants';
import { PriceRange } from '@/types';

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPriceRange(range: PriceRange, min?: number | null, max?: number | null): string {
  if (min && max) {
    return `${formatRupiah(min)} – ${formatRupiah(max)}`;
  }
  const found = PRICE_RANGES.find((r) => r.id === range);
  return found ? found.label : 'Harga bervariasi';
}

export function formatDateIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatRelativeTimeIndo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) return formatDateIndo(dateStr);
    if (diffDay > 0) return `${diffDay} hari lalu`;
    if (diffHour > 0) return `${diffHour} jam lalu`;
    if (diffMin > 0) return `${diffMin} menit lalu`;
    return 'Baru saja';
  } catch {
    return 'Baru saja';
  }
}

export function formatDistanceKm(km?: number): string {
  if (km === undefined || km === null) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
