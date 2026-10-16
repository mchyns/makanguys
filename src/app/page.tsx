'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Place } from '@/types';
import Navbar from '@/components/layout/Navbar';
import SearchBar from '@/components/places/SearchBar';
import FilterBar from '@/components/places/FilterBar';
import PlaceCard from '@/components/places/PlaceCard';
import { useDebounce } from '@/hooks/useDebounce';
import { formatPriceRange } from '@/lib/utils/format';
import {
  Map as MapIcon,
  List as ListIcon,
  Plus,
  UtensilsCrossed,
  Loader2,
  Database,
  X,
  ArrowRight,
} from 'lucide-react';

// Dynamic import with SSR disabled for MapLibre WebGL canvas
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
      <p className="text-xs font-semibold text-slate-600">Menyiapkan peta interaktif...</p>
    </div>
  ),
});

// Dynamic import AddPlaceModal to dramatically shrink initial homepage JS bundle
const AddPlaceModal = dynamic(() => import('@/components/forms/AddPlaceModal'), {
  ssr: false,
});

function HomeContent() {
  const searchParams = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name_asc' | 'nearest'>('newest');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('makanguys_user_coords');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            return { lat: parsed.lat, lng: parsed.lng };
          }
        }
      } catch {}
    }
    return null;
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Auto-open modal if ?tambah=1
  useEffect(() => {
    if (searchParams.get('tambah') === '1') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  // Fetch places
  const fetchPlaces = async () => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (category !== 'all') params.set('category', category);
      if (priceRange !== 'all') params.set('price_range', priceRange);
      if (sortOrder) params.set('sort', sortOrder);
      if (userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
      }

      const res = await fetch(`/api/places?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setPlaces(data.data || []);
        setIsFallback(Boolean(data.isFallback));
      }
    } catch (e) {
      console.error('Failed to fetch places:', e);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [debouncedSearch, category, priceRange, sortOrder, userLocation]);

  const hasActiveFilters = searchQuery !== '' || category !== 'all' || priceRange !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setPriceRange('all');
    setSortOrder('newest');
  };

  return (
    <div className="h-screen h-dvh flex flex-col bg-slate-50 font-sans overflow-hidden">
      <Navbar onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Mobile Top Search & Filter Strip (Clean, separate, zero collision with map controls) */}
      <div className="lg:hidden w-full bg-white border-b border-slate-200 px-3 pt-2.5 pb-2 flex flex-col gap-2 shrink-0 z-20 shadow-2xs">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterBar
          selectedCategory={category}
          onSelectCategory={setCategory}
          selectedPriceRange={priceRange}
          onSelectPriceRange={setPriceRange}
          selectedSort={sortOrder}
          onSelectSort={setSortOrder}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          totalCount={places.length}
        />
      </div>

      {/* Main Full-Bleed Application Viewport */}
      <main className="flex-1 w-full min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Places List Panel (Sidebar on desktop, full tab on mobile) */}
        <div
          className={`flex-col bg-white border-r border-slate-200 shadow-xs z-10 overflow-hidden lg:w-[450px] xl:w-[480px] lg:shrink-0 lg:h-full ${
            mobileTab === 'list' ? 'flex flex-1 w-full h-full min-h-0' : 'hidden lg:flex'
          }`}
        >
          {/* Header with Title, Search and Filters (Desktop only; mobile uses dedicated top strip above) */}
          <div className="hidden lg:flex p-4 border-b border-slate-100 flex-col gap-2.5 shrink-0 bg-white">
            <div>
              <h1 className="text-xl font-black text-navy tracking-tight">
                Makan Guys, Meninggal kalian kalo gak makan
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Temukan warung favorit, kedai tersembunyi, dan rekomendasi lokal.
              </p>
            </div>

            {/* Search Input */}
            <SearchBar value={searchQuery} onChange={setSearchQuery} />

            {/* Category & Filters */}
            <FilterBar
              selectedCategory={category}
              onSelectCategory={setCategory}
              selectedPriceRange={priceRange}
              onSelectPriceRange={setPriceRange}
              selectedSort={sortOrder}
              onSelectSort={setSortOrder}
              onReset={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              totalCount={places.length}
            />
          </div>

          {/* List Counter & Filter Status */}
          <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-700">
              Daftar Rekomendasi ({places.length})
            </span>
            {selectedPlace && (
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Batal Pilih
              </button>
            )}
          </div>

          {/* Scrollable Places List */}
          <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-medium">Memuat rekomendasi kuliner...</p>
              </div>
            ) : places.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <UtensilsCrossed className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Belum Ada Rekomendasi di Sini</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Tidak ditemukan tempat makan dengan kata kunci atau filter ini. Jadilah orang pertama yang menandai tempat enak!
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Tambah Tempat Pertama
                </button>
              </div>
            ) : (
              places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isSelected={selectedPlace?.id === place.id}
                  onSelectOnMap={(p) => {
                    setSelectedPlace(p);
                    // Switch to map view on mobile if clicked
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setMobileTab('map');
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Interactive Map Panel (Full Bleed: Edge-to-Edge, No Curves, No Borders, Full Height to Screen Bottom) */}
        <div
          className={`relative flex-1 h-full min-h-0 w-full overflow-hidden bg-slate-100 ${
            mobileTab === 'map' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <MapComponent
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onUserLocationChange={(coords) => setUserLocation(coords)}
            initialCoords={userLocation || undefined}
            className="w-full h-full min-h-0 rounded-none border-0"
            isVisible={mobileTab === 'map'}
          />

          {/* Mobile Bottom Sheet Preview when a place is selected on the map */}
          {selectedPlace && (
            <div className="lg:hidden absolute bottom-20 left-3 right-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    {selectedPlace.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                    {selectedPlace.name}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                    {selectedPlace.featured_food}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-slate-800 shrink-0">
                      {formatPriceRange(selectedPlace.price_range, selectedPlace.price_min, selectedPlace.price_max)}
                    </span>
                    <span>•</span>
                    <span className="truncate">{selectedPlace.address_text}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href={`/tempat/${selectedPlace.slug}`}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <span>Buka Detail Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom View Switcher for Mobile (Centered & Thumb-Friendly) */}
      <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center bg-navy/95 text-white backdrop-blur-md px-1.5 py-1.5 rounded-full shadow-2xl border border-white/20 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            mobileTab === 'map'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Peta</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            mobileTab === 'list'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ListIcon className="w-3.5 h-3.5" />
          <span>Daftar ({places.length})</span>
        </button>
      </div>

      {/* Floating Add Place Button (Universal across Mobile & Desktop) */}
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all border-2 border-white/60 hover:shadow-blue-500/25 group"
          title="Tambah Rekomendasi Tempat Makan"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
          <span className="hidden sm:inline font-bold text-xs tracking-tight">
            Tambah Tempat
          </span>
        </button>
      </div>

      {/* Add Place Modal */}
      <AddPlaceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchPlaces();
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
