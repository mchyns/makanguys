'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Place } from '@/types';
import Navbar from '@/components/layout/Navbar';
import ReportModal from '@/components/reports/ReportModal';
import PlaceCard from '@/components/places/PlaceCard';
import { useBookmarks } from '@/hooks/useBookmarks';
import { formatPriceRange, formatDateIndo } from '@/lib/utils/format';
import { CATEGORIES } from '@/lib/constants';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[280px] bg-slate-100 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
    </div>
  ),
});
import {
  MapPin,
  Share2,
  Bookmark,
  AlertTriangle,
  ArrowLeft,
  Navigation,
  User,
  Calendar,
  Utensils,
  Check,
  Loader2,
} from 'lucide-react';

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [place, setPlace] = useState<Place | null>(null);
  const [related, setRelated] = useState<Place[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    if (!slug) return;
    const fetchPlace = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/places/${slug}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Tempat makan tidak ditemukan');
          return;
        }
        setPlace(data.data);
        setRelated(data.related || []);
      } catch {
        setErrorMsg('Gagal memuat detail tempat makan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlace();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Memuat detail rekomendasi...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !place) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Tempat Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Tempat makan yang Anda cari mungkin belum dipublikasikan, sedang ditinjau, atau tautan yang Anda buka tidak valid.
          </p>
          <Link
            href="/"
            className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Kembali ke Peta Jelajah
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = CATEGORIES.find((c) => c.id === place.category)?.label || place.category;
  const bookmarked = isBookmarked(place.id);

  // Photos
  const photos = place.photos && place.photos.length > 0
    ? place.photos.map((p) => p.url || p.storage_path)
    : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80'];

  const currentPhoto = photos[activePhotoIdx] || photos[0];

  // Directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  // Share Handler
  const handleShare = async () => {
    const shareData = {
      title: `${place.name} - MakanGuys`,
      text: `Cobain ${place.featured_food} di ${place.name}! Rekomendasi kuliner di MakanGuys:`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or unsupported
      }
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-12 flex-1 flex flex-col gap-6">
        {/* Back navigation */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Hasil Eksplorasi</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          {/* Main Photo Hero */}
          <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-slate-900 overflow-hidden">
            <img
              src={currentPhoto}
              alt={place.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-white/90 backdrop-blur-md text-navy text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                {categoryLabel}
              </span>
            </div>

            {/* Quick Actions (Bookmark & Share) */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleBookmark(place)}
                className={`p-2.5 rounded-full backdrop-blur-md shadow-md transition ${
                  bookmarked
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/85 text-slate-800 hover:bg-white'
                }`}
                title={bookmarked ? 'Tersimpan' : 'Simpan'}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-md shadow-md transition flex items-center justify-center"
                title="Bagikan Tautan"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Place Header on Hero */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                {place.name}
              </h1>
              <p className="text-blue-300 font-semibold text-sm sm:text-base mt-1 drop-shadow-xs flex items-center gap-1.5">
                <Utensils className="w-4 h-4" />
                <span>Menu Unggulan: {place.featured_food}</span>
              </p>
            </div>
          </div>

          {/* Photo Thumbnails Gallery */}
          {photos.length > 1 && (
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    activePhotoIdx === idx ? 'border-blue-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Body Content Details */}
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8">
            {/* Left Column: Description & Metadata */}
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Cerita & Cita Rasa
                </h2>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {place.description}
                </p>
              </div>

              {/* Price & Contributor Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Perkiraan Harga
                  </span>
                  <span className="text-sm font-bold text-navy mt-1 block">
                    {formatPriceRange(place.price_range, place.price_min, place.price_max)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Kontributor Rekomendasi
                  </span>
                  <span className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{place.is_anonymous || !place.contributor_name ? 'Anonim' : place.contributor_name}</span>
                  </span>
                </div>
              </div>

              {/* Timestamp & Report Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Direkomendasikan pada {formatDateIndo(place.created_at)}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="flex items-center gap-1 text-slate-500 hover:text-red-600 font-semibold transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Laporkan Tempat</span>
                </button>
              </div>
            </div>

            {/* Right Column: Mini Map & Navigation Actions */}
            <div className="w-full md:w-80 flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Lokasi Tempat</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">{place.address_text}</p>

                {/* Mini Interactive Map */}
                <div className="h-52 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                  <MapComponent
                    places={[place]}
                    selectedPlace={place}
                    miniMode={true}
                    className="w-full h-full min-h-[208px]"
                  />
                </div>

                {/* Directions Button */}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition"
                >
                  <Navigation className="w-4 h-4 stroke-[2.5]" />
                  <span>Buka Petunjuk Arah (Google Maps)</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related Places */}
        {related.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-extrabold text-navy text-lg tracking-tight">
              Rekomendasi Terkait di Kategori {categoryLabel}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {related.map((relPlace) => (
                <PlaceCard key={relPlace.id} place={relPlace} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Report Modal */}
      <ReportModal
        place={place}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
