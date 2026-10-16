'use client';

import React from 'react';
import Link from 'next/link';
import { Place } from '@/types';
import { formatPriceRange, formatDistanceKm } from '@/lib/utils/format';
import { CATEGORIES } from '@/lib/constants';
import { Bookmark, MapPin, Navigation, User, ArrowRight } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';

interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
  onSelectOnMap?: (place: Place) => void;
}

export default function PlaceCard({ place, isSelected = false, onSelectOnMap }: PlaceCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(place.id);

  const categoryLabel = CATEGORIES.find((c) => c.id === place.category)?.label || place.category;
  const photoUrl =
    place.photos?.[0]?.url ||
    place.photos?.[0]?.storage_path ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shrink-0 ${
        isSelected
          ? 'border-blue-500 shadow-md ring-2 ring-blue-100'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Photo Header */}
      <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden shrink-0">
        <img
          src={photoUrl}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
          loading="lazy"
        />

        {/* Category Pill */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-xs">
            {categoryLabel}
          </span>
        </div>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleBookmark(place);
          }}
          title={bookmarked ? 'Hapus dari tersimpan' : 'Simpan tempat ini'}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition shadow-xs ${
            bookmarked
              ? 'bg-blue-600 text-white'
              : 'bg-white/85 backdrop-blur-xs text-slate-700 hover:bg-white hover:text-blue-600'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Distance Badge if available */}
        {place.distance_km !== undefined && (
          <div className="absolute bottom-2.5 left-2.5 bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span>{formatDistanceKm(place.distance_km)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <Link href={`/tempat/${place.slug}`} className="hover:underline">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
              {place.name}
            </h3>
          </Link>

          <p className="text-blue-600 font-semibold text-xs mt-1 line-clamp-1">
            {place.featured_food}
          </p>

          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium text-slate-700 tabular-nums">
              {formatPriceRange(place.price_range, place.price_min, place.price_max)}
            </span>
            <span className="flex items-center gap-1 line-clamp-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>{place.is_anonymous || !place.contributor_name ? 'Anonim' : place.contributor_name}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{place.address_text}</span>
          </div>

          {/* Action Row */}
          <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
            {onSelectOnMap && (
              <button
                type="button"
                onClick={() => onSelectOnMap(place)}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 py-1 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Lihat di Peta</span>
              </button>
            )}

            <Link
              href={`/tempat/${place.slug}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 py-1 ml-auto transition"
            >
              <span>Detail Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
