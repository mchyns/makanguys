import { CategoryOption, PriceRangeOption, SortOption } from '@/types';

export const CATEGORIES: CategoryOption[] = [
  { id: 'nasi-lauk', label: 'Nasi & Lauk', iconName: 'Utensils' },
  { id: 'bakso-mi', label: 'Bakso & Mi', iconName: 'Soup' },
  { id: 'sate-bakaran', label: 'Sate & Bakaran', iconName: 'Flame' },
  { id: 'ayam-bebek', label: 'Ayam & Bebek', iconName: 'Drumstick' },
  { id: 'seafood', label: 'Seafood', iconName: 'Fish' },
  { id: 'jajanan', label: 'Jajanan Kaki Lima', iconName: 'Cookie' },
  { id: 'kopi-minuman', label: 'Kopi & Minuman', iconName: 'Coffee' },
  { id: 'roti-dessert', label: 'Roti & Dessert', iconName: 'Cake' },
  { id: 'tradisional', label: 'Makanan Tradisional', iconName: 'Salad' },
  { id: 'internasional', label: 'Makanan Internasional', iconName: 'Globe' },
  { id: 'lainnya', label: 'Lainnya', iconName: 'Sparkles' },
];

export const PRICE_RANGES: PriceRangeOption[] = [
  { id: 'under_15k', label: 'Di bawah Rp15.000', shortLabel: '< Rp15rb', desc: 'Sangat Hemat' },
  { id: '15k_30k', label: 'Rp15.000 – Rp30.000', shortLabel: 'Rp15rb - Rp30rb', desc: 'Standar Warung' },
  { id: '30k_50k', label: 'Rp30.000 – Rp50.000', shortLabel: 'Rp30rb - Rp50rb', desc: 'Menengah' },
  { id: 'above_50k', label: 'Di atas Rp50.000', shortLabel: '> Rp50rb', desc: 'Premium' },
  { id: 'unknown', label: 'Tidak diketahui', shortLabel: '?', desc: 'Belum terdata' },
];

export const SORT_OPTIONS: SortOption[] = [
  { id: 'newest', label: 'Terbaru Ditambahkan' },
  { id: 'nearest', label: 'Terdekat dari Saya' },
  { id: 'name_asc', label: 'Nama (A – Z)' },
  { id: 'oldest', label: 'Rekomendasi Pertama' },
];

export const REPORT_REASONS = [
  { id: 'lokasi_salah', label: 'Titik koordinat atau alamat salah' },
  { id: 'sudah_tutup', label: 'Tempat makan sudah tutup permanen' },
  { id: 'spam', label: 'Spam, iklan tidak relevan, atau komersial masif' },
  { id: 'konten_palsu', label: 'Informasi atau foto palsu / menyesatkan' },
  { id: 'tidak_pantas', label: 'Foto atau bahasa kasar / tidak pantas' },
  { id: 'duplikat', label: 'Tempat makan ini sudah pernah ditandai sebelumnya' },
  { id: 'lainnya', label: 'Alasan lainnya' },
];

export const DEFAULT_MAP_CENTER = {
  lng: 106.8272, // Jakarta Monas center as default view
  lat: -6.1754,
  zoom: 12,
};

// High-performance, universally accessible map style using Esri ArcGIS World Street Map
// Free public GIS endpoint, zero API key required, not blocked by Brave Shields or adblockers
export const DEFAULT_MAP_STYLE: any = {
  version: 8,
  sources: {
    'esri-streets': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 17, // Native tiles in Indonesia exist up to z17. Setting 17 tells MapLibre to overscale tiles for zoom 18+ without requesting watermark dummy tiles
      attribution:
        '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> &mdash; StreetMap Community',
    },
  },
  layers: [
    {
      id: 'esri-streets-layer',
      type: 'raster',
      source: 'esri-streets',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// High-resolution Satellite Imagery Style
export const SATELLITE_MAP_STYLE: any = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19, // Native satellite imagery exists up to z19; overscales cleanly for deeper zoom
      attribution:
        '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> &mdash; Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-imagery',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// Universal Topographic Fallback
export const OSM_RASTER_STYLE: any = {
  version: 8,
  sources: {
    'esri-topo': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution: '&copy; Esri',
    },
  },
  layers: [
    {
      id: 'esri-topo-layer',
      type: 'raster',
      source: 'esri-topo',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};
