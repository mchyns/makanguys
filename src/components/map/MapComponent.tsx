import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, Popup, AttributionControl, setWorkerUrl } from 'maplibre-gl';
import { Place } from '@/types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_STYLE, SATELLITE_MAP_STYLE, OSM_RASTER_STYLE } from '@/lib/constants';
import { Layers, Navigation, Compass, Plus, Minus, MapPin, AlertCircle, Loader2, Globe } from 'lucide-react';

// Configure same-origin MapLibre worker to resolve Turbopack Worker load failure
if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre-gl-worker.mjs');
}

interface MapComponentProps {
  places?: Place[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place | null) => void;
  onUserLocationChange?: (coords: { lat: number; lng: number }) => void;
  // Picker mode for selecting coordinates in form
  pickerMode?: boolean;
  miniMode?: boolean;
  initialCoords?: { lat: number; lng: number };
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  isVisible?: boolean;
}

export default function MapComponent({
  places = [],
  selectedPlace = null,
  onSelectPlace,
  onUserLocationChange,
  pickerMode = false,
  miniMode = false,
  initialCoords,
  onCoordinatesChange,
  className = 'w-full h-full min-h-[420px]',
  isVisible = true,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{ [key: string]: Marker }>({});
  const pickerMarkerRef = useRef<Marker | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [locating, setLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Prevent duplicate instances

    // Check initial coordinates: prioritizing selectedPlace for detail/mini views, then initialCoords, then saved user coords, then places[0]
    let centerLng = DEFAULT_MAP_CENTER.lng;
    let centerLat = DEFAULT_MAP_CENTER.lat;
    let initialZoom = DEFAULT_MAP_CENTER.zoom;
    let hasSavedLocation = false;

    if (selectedPlace) {
      centerLng = selectedPlace.longitude;
      centerLat = selectedPlace.latitude;
      initialZoom = 15;
    } else if (initialCoords) {
      centerLng = initialCoords.lng;
      centerLat = initialCoords.lat;
      initialZoom = 14.5;
      hasSavedLocation = true;
    } else if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('makanguys_user_coords');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            centerLat = parsed.lat;
            centerLng = parsed.lng;
            initialZoom = 14.5;
            hasSavedLocation = true;
          }
        } else if (places[0]) {
          centerLng = places[0].longitude;
          centerLat = places[0].latitude;
        }
      } catch {}
    }

    try {
      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: DEFAULT_MAP_STYLE,
        center: [centerLng, centerLat],
        zoom: pickerMode ? 14 : initialZoom,
        maxZoom: 19,
        minZoom: 4,
        pitch: is3D ? 55 : 0,
        bearing: is3D ? 18 : 0,
        attributionControl: false,
      });

      mapRef.current = map;
      map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

      let ready = false;
      const markReady = () => {
        if (ready) return;
        ready = true;
        setIsLoaded(true);
        setLoadError(null);
        map.resize();
        if (hasSavedLocation && !miniMode && !selectedPlace) {
          updateUserMarker(map, centerLng, centerLat);
        }
      };

      map.once('load', markReady);
      map.once('styledata', markReady);
      map.once('idle', markReady);

      // Instant ready timer (max 600ms) to ensure markers and controls are responsive immediately
      const instantTimer = setTimeout(() => {
        markReady();
      }, 600);

      map.on('error', (e) => {
        console.warn('MapLibre event:', e);
        // Fallback to Topo raster if primary street tiles ever error
        try {
          if (!ready) {
            map.setStyle(OSM_RASTER_STYLE as any);
          }
        } catch {}
      });

      // Handle click for coordinate picking
      if (pickerMode) {
        map.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          if (pickerMarkerRef.current) {
            pickerMarkerRef.current.setLngLat([lng, lat]);
          }
          if (onCoordinatesChange) {
            onCoordinatesChange({ lat, lng });
          }
        });
      }

      // ResizeObserver to ensure map canvas automatically resizes with parent flex container
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(instantTimer);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err: any) {
      console.error('Failed to initialize map:', err);
      setLoadError('Tidak dapat menginisialisasi peta. Periksa koneksi internet.');
    }
  }, [pickerMode]);

  // Handle visibility & tab changes
  useEffect(() => {
    if (isVisible !== false && mapRef.current) {
      const r1 = requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
      const t1 = setTimeout(() => {
        mapRef.current?.resize();
      }, 80);
      const t2 = setTimeout(() => {
        mapRef.current?.resize();
      }, 300);
      return () => {
        cancelAnimationFrame(r1);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isVisible]);

  // Handle Window Resize and Orientation Change
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Handle Coordinates Picker Marker
  useEffect(() => {
    if (!pickerMode || !mapRef.current || !isLoaded) return;

    const coords = initialCoords || { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng };

    if (!pickerMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'cursor-grab flex flex-col items-center';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="w-2.5 h-2.5 bg-blue-600 rotate-45 -mt-1 rounded-xs"></div>
        </div>
        <div class="bg-navy text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
          Geser atau Klik Peta
        </div>
      `;

      const marker = new Marker({ element: el, draggable: true })
        .setLngLat([coords.lng, coords.lat])
        .addTo(mapRef.current);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        if (onCoordinatesChange) {
          onCoordinatesChange({ lat: lngLat.lat, lng: lngLat.lng });
        }
      });

      pickerMarkerRef.current = marker;
    } else {
      pickerMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    }
  }, [pickerMode, initialCoords, isLoaded, onCoordinatesChange]);

  // Update Places Markers
  useEffect(() => {
    if (pickerMode || !mapRef.current || !isLoaded) return;

    const currentMap = mapRef.current;

    // Remove obsolete markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!places.some((p) => p.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers with uploaded food photo pins
    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const photoUrl =
        place.photos?.[0]?.url ||
        place.photos?.[0]?.storage_path ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

      const renderMarkerContent = (active: boolean) => `
        <div class="makan-photo-pin flex flex-col items-center cursor-pointer group transition-all duration-200" style="touch-action: manipulation;">
          <div class="relative ${
            active
              ? 'w-14 h-14 scale-115 ring-4 ring-blue-500/70 shadow-2xl z-30'
              : 'w-11 h-11 hover:scale-110 shadow-lg z-10'
          } rounded-full bg-white p-0.5 border-2 ${
            active ? 'border-blue-600' : 'border-white hover:border-blue-400'
          } transition-all duration-200">
            <img
              src="${photoUrl}"
              alt="${place.name}"
              class="w-full h-full object-cover rounded-full bg-slate-200"
              loading="lazy"
            />
            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${
              active ? 'bg-blue-600 text-white ring-1 ring-white' : 'bg-navy text-white'
            } border border-white flex items-center justify-center text-[8px] font-bold shadow-xs">
              🍴
            </div>
          </div>
          <div class="w-2.5 h-2.5 bg-white border-b-2 border-r-2 ${
            active ? 'border-blue-600' : 'border-slate-300'
          } rotate-45 -mt-1 shadow-xs"></div>
          <div class="mt-1 bg-navy/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md max-w-[130px] truncate ${
            active ? 'opacity-100 scale-105 bg-blue-600 ring-2 ring-white/50' : 'opacity-90 group-hover:opacity-100'
          } transition-all pointer-events-none">
            ${place.name}
          </div>
        </div>
      `;

      if (!markersRef.current[place.id]) {
        const el = document.createElement('div');
        el.className = 'makan-marker cursor-pointer group transition-transform duration-200';
        el.setAttribute('data-id', place.id);

        el.innerHTML = renderMarkerContent(isSelected);

        // Custom Popup
        const popupContent = `
          <div class="w-64 bg-white rounded-xl overflow-hidden font-sans">
            <div class="h-28 w-full bg-slate-100 overflow-hidden relative">
              <img src="${photoUrl}" alt="${place.name}" class="w-full h-full object-cover" />
              <span class="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                ${place.category}
              </span>
            </div>
            <div class="p-3">
              <h4 class="font-bold text-slate-900 text-sm line-clamp-1">${place.name}</h4>
              <p class="text-blue-600 text-xs font-medium line-clamp-1 mt-0.5">${place.featured_food}</p>
              <p class="text-slate-500 text-[11px] line-clamp-1 mt-1">${place.address_text}</p>
              <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <a href="/tempat/${place.slug}" class="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Lihat Detail →
                </a>
              </div>
            </div>
          </div>
        `;

        const popup = new Popup({ offset: 25, closeButton: true }).setHTML(popupContent);

        const marker = new Marker({ element: el })
          .setLngLat([place.longitude, place.latitude])
          .setPopup(popup)
          .addTo(currentMap);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectPlace) {
            onSelectPlace(place);
          }
          currentMap.flyTo({
            center: [place.longitude, place.latitude],
            zoom: Math.max(currentMap.getZoom(), 14),
            duration: 800,
          });
        });

        markersRef.current[place.id] = marker;
      } else {
        // Update selection state and marker content
        const marker = markersRef.current[place.id];
        const el = marker.getElement();
        el.innerHTML = renderMarkerContent(isSelected);
        if (isSelected) {
          el.classList.add('z-30');
        } else {
          el.classList.remove('z-30');
        }
      }
    });
  }, [places, selectedPlace, isLoaded, pickerMode, onSelectPlace]);

  // Helper to add or update user steady location marker (clean GPS dot without blinking or pulsing)
  const updateUserMarker = (map: MapLibreMap, lng: number, lat: number) => {
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 flex items-center justify-center';
      el.innerHTML = `
        <div class="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-md flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      `;
      userMarkerRef.current = new Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }
  };

  // Auto-sync user location on map load / refresh (only for main map, not miniMode or pickerMode)
  useEffect(() => {
    if (!mapRef.current || !isLoaded || pickerMode || miniMode) return;

    // Check if user already synced location previously
    const savedLocation = localStorage.getItem('makanguys_user_coords');
    if (savedLocation) {
      try {
        const { lat, lng } = JSON.parse(savedLocation);
        if (typeof lat === 'number' && typeof lng === 'number') {
          updateUserMarker(mapRef.current, lng, lat);
          if (!selectedPlace) {
            mapRef.current.setCenter([lng, lat]);
          }
        }
      } catch {}
    } else if (navigator.geolocation && !selectedPlace) {
      // Auto-detect location gracefully if permission is already granted
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (!mapRef.current) return;
          try {
            localStorage.setItem('makanguys_user_coords', JSON.stringify({ lat: latitude, lng: longitude }));
          } catch {}
          updateUserMarker(mapRef.current, longitude, latitude);
          if (!selectedPlace) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              duration: 1000,
            });
          }
        },
        () => {
          // Ignore silently if permission denied
        },
        { timeout: 4000, enableHighAccuracy: false }
      );
    }
  }, [isLoaded, pickerMode, selectedPlace]);

  // Fly to selected place ONLY when selectedPlace changes (do NOT re-fly on is3D toggle!)
  useEffect(() => {
    if (!mapRef.current || !selectedPlace || !isLoaded) return;
    mapRef.current.flyTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: 14.5,
      duration: 1000,
    });
  }, [selectedPlace, isLoaded]);

  // Controls Handlers
  const handleZoomIn = () => {
    if (mapRef.current && mapRef.current.getZoom() < 19) {
      mapRef.current.zoomIn();
    }
  };
  const handleZoomOut = () => {
    if (mapRef.current && mapRef.current.getZoom() > 4) {
      mapRef.current.zoomOut();
    }
  };
  const handleResetNorth = () => {
    mapRef.current?.resetNorthPitch({ duration: 800 });
    setIs3D(false);
  };

  const toggle3D = () => {
    if (!mapRef.current) return;
    const nextState = !is3D;
    setIs3D(nextState);
    // Smoothly tilt and preserve EXACT current center coordinates!
    mapRef.current.easeTo({
      pitch: nextState ? 55 : 0,
      bearing: nextState ? 18 : 0,
      duration: 800,
    });
  };

  const toggleSatellite = () => {
    if (!mapRef.current) return;
    const nextState = !isSatellite;
    setIsSatellite(nextState);
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const pitch = mapRef.current.getPitch();
    const bearing = mapRef.current.getBearing();
    mapRef.current.setStyle(nextState ? SATELLITE_MAP_STYLE : DEFAULT_MAP_STYLE, { diff: false });
    mapRef.current.once('styledata', () => {
      mapRef.current?.jumpTo({
        center,
        zoom,
        pitch,
        bearing,
      });
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung fitur lokasi geolokasi.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;

        if (!mapRef.current) return;

        // Save to localStorage so future refreshes always start at this synced location
        try {
          localStorage.setItem('makanguys_user_coords', JSON.stringify({ lat: latitude, lng: longitude }));
        } catch {}

        updateUserMarker(mapRef.current, longitude, latitude);

        // Deselect any selected place so map doesn't get pulled back to an old selection
        if (onSelectPlace) {
          onSelectPlace(null);
        }
        if (onUserLocationChange) {
          onUserLocationChange({ lat: latitude, lng: longitude });
        }

        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1200,
        });

        if (pickerMode && onCoordinatesChange) {
          onCoordinatesChange({ lat: latitude, lng: longitude });
          if (pickerMarkerRef.current) {
            pickerMarkerRef.current.setLngLat([longitude, latitude]);
          }
        }
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation denied or failed:', err);
        alert('Izin lokasi tidak diberikan. Anda tetap bisa memilih lokasi langsung di peta secara manual.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* Map canvas container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Loading state indicator */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-600">Menyiapkan peta interaktif...</p>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center z-20">
          <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
          >
            Muat Ulang Halaman
          </button>
        </div>
      )}

      {/* Controls Floating Toolbar */}
      {!miniMode ? (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col items-end gap-2">
          {/* Peta Jalan / Satelit View Toggle */}
          <button
            type="button"
            onClick={toggleSatellite}
            title={isSatellite ? 'Beralih ke Peta Jalan' : 'Beralih ke Citra Satelit'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
              isSatellite
                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                : 'bg-white/95 backdrop-blur-xs text-slate-700 hover:bg-white hover:text-blue-600'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{isSatellite ? 'Satelit' : 'Peta Jalan'}</span>
          </button>

          {/* 3D / Flat View Toggle */}
          <button
            type="button"
            onClick={toggle3D}
            title={is3D ? 'Beralih ke Tampilan Datar' : 'Beralih ke Tampilan 3D'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
              is3D
                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                : 'bg-white/95 backdrop-blur-xs text-slate-700 hover:bg-white hover:text-blue-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{is3D ? 'Mode 3D Aktif' : 'Tampilan 3D'}</span>
          </button>

          {/* Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            title="Tentukan Lokasi Saya"
            className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-xs text-slate-700 hover:bg-white hover:text-blue-600 shadow-md flex items-center justify-center transition"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </button>

          {/* Zoom In & Out Controls */}
          <div className="w-9 flex flex-col rounded-xl overflow-hidden bg-white/95 backdrop-blur-xs shadow-md border border-slate-200/60 divide-y divide-slate-100">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar"
              className="w-full h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil"
              className="w-full h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetNorth}
              title="Reset Arah Utara"
              className="w-full h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Compact Zoom Controls for Mini Map */
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col rounded-xl overflow-hidden bg-white/95 backdrop-blur-xs shadow-md border border-slate-200/80 divide-y divide-slate-100">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Perbesar"
            className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Perkecil"
            className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Coordinate Display for Picker Mode */}
      {pickerMode && initialCoords && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10 bg-white/95 backdrop-blur-xs border border-slate-200 px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-slate-800">Koordinat: </span>
            <span className="tabular-nums text-slate-600">
              {initialCoords.lat.toFixed(6)}, {initialCoords.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
