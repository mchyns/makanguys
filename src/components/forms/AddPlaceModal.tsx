'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlaceSubmissionSchema, PlaceSubmissionInput } from '@/lib/validations/place';
import { CATEGORIES, PRICE_RANGES, DEFAULT_MAP_CENTER } from '@/lib/constants';
import { compressImage } from '@/lib/utils/image';
import {
  X,
  Upload,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';

// Lazy-load MapComponent so MapLibre GL JS bundle is not loaded until modal Step 2
const MapComponent = dynamic(() => import('../map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-500 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <span className="text-xs">Memuat peta lokasi...</span>
    </div>
  ),
});

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddPlaceModal({ isOpen, onClose, onSuccess }: AddPlaceModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_MAP_CENTER.lat,
    lng: DEFAULT_MAP_CENTER.lng,
  });
  const [selectedPhotos, setSelectedPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Address & Landmark States
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isDetectingAddress, setIsDetectingAddress] = useState(false);
  const [hasUserEditedStreet, setHasUserEditedStreet] = useState(false);
  const geocodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<PlaceSubmissionInput>({
    resolver: zodResolver(PlaceSubmissionSchema) as any,
    defaultValues: {
      name: '',
      featured_food: '',
      category: '',
      description: '',
      price_range: '15k_30k',
      address_text: '',
      latitude: DEFAULT_MAP_CENTER.lat,
      longitude: DEFAULT_MAP_CENTER.lng,
      contributor_name: '',
      is_anonymous: false,
      photos: [],
      website_honeypot: '',
    },
  });

  // Auto-detect street name when coordinates change or entering Step 2
  const detectAddressFromCoords = async (lat: number, lng: number, force = false) => {
    if (hasUserEditedStreet && !force) return;
    setIsDetectingAddress(true);
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (res.ok && data.success && data.formatted) {
        setStreetAddress(data.formatted);
        const fullAddr = landmark.trim()
          ? `${data.formatted} (Patokan: ${landmark.trim()})`
          : data.formatted;
        setValue('address_text', fullAddr, { shouldValidate: true });
      }
    } catch (e) {
      console.warn('Auto geocode failed:', e);
    } finally {
      setIsDetectingAddress(false);
    }
  };

  // Trigger address detection automatically when step becomes 2
  useEffect(() => {
    if (step === 2 && !streetAddress && !hasUserEditedStreet) {
      detectAddressFromCoords(coords.lat, coords.lng);
    }
  }, [step]);

  if (!isOpen) return null;

  // Handle Photo selection & validation with ultra-fast parallel compression
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    if (selectedPhotos.length + files.length > 5) {
      alert('Maksimal 5 foto per tempat makan.');
      e.target.value = '';
      return;
    }

    setIsCompressing(true);
    try {
      const validFiles = files.filter((file) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          alert(`Format berkas ${file.name} tidak didukung. Harap pilih JPEG, PNG, atau WebP.`);
          return false;
        }
        return true;
      });

      // Compress all files concurrently in parallel (< 0.8s total)
      const compressedList = await Promise.all(
        validFiles.map(async (file) => {
          const compressed = await compressImage(file, 960, 0.72);
          return {
            file: compressed,
            preview: URL.createObjectURL(compressed),
          };
        })
      );

      const updated = [...selectedPhotos, ...compressedList];
      setSelectedPhotos(updated);
      setValue('photos', updated.map((p) => p.preview));
    } catch (err) {
      console.error('Error compressing photos:', err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const updated = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(updated);
    setValue('photos', updated.map((p) => p.preview));
  };

  // Step Navigation with validation
  const handleNextStep = async () => {
    if (step === 1) {
      const valid = await trigger(['name', 'featured_food', 'category', 'price_range']);
      if (valid) setStep(2);
    } else if (step === 2) {
      const full = landmark.trim()
        ? `${streetAddress.trim()} (Patokan: ${landmark.trim()})`
        : streetAddress.trim();
      setValue('address_text', full);
      const valid = await trigger(['address_text', 'latitude', 'longitude']);
      if (valid) setStep(3);
    } else if (step === 3) {
      if (selectedPhotos.length === 0) {
        alert('Wajib menambahkan minimal 1 foto makanan atau tempat makan.');
        return;
      }
      setStep(4);
    }
  };

  // Submit Handler
  const onSubmit = async (values: PlaceSubmissionInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Upload photos first (already pre-compressed in parallel)
      setIsUploading(true);
      const formData = new FormData();
      selectedPhotos.forEach((p) => {
        formData.append('files', p.file);
      });

      let uploadRes: Response;
      try {
        uploadRes = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });
      } catch (netErr: any) {
        throw new Error('Gagal terhubung saat mengunggah foto. Pastikan koneksi internet stabil.');
      }

      let uploadJson: any = null;
      try {
        uploadJson = await uploadRes.json();
      } catch {
        if (uploadRes.status === 413) {
          throw new Error('Ukuran foto terlalu besar untuk jaringan Vercel. Coba kurangi jumlah foto.');
        }
        throw new Error(`Gagal mengunggah foto (status: ${uploadRes.status})`);
      }

      if (!uploadRes.ok) {
        throw new Error(uploadJson?.error || 'Gagal mengunggah foto');
      }

      setIsUploading(false);
      const uploadedPaths: string[] = uploadJson.paths || [];

      // Combine street & landmark for final clean address
      const fullAddress = landmark.trim()
        ? `${streetAddress.trim()} (Patokan: ${landmark.trim()})`
        : streetAddress.trim() || values.address_text;

      // 2. Submit place metadata
      const payload = {
        ...values,
        address_text: fullAddress,
        latitude: coords.lat,
        longitude: coords.lng,
        is_anonymous: isAnonymous,
        contributor_name: isAnonymous ? null : values.contributor_name,
        photos: uploadedPaths,
      };

      let placeRes: Response;
      try {
        placeRes = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (netErr: any) {
        throw new Error('Gagal terhubung saat menyimpan data. Pastikan koneksi internet stabil.');
      }

      let placeJson: any = null;
      try {
        placeJson = await placeRes.json();
      } catch {
        throw new Error(`Gagal menyimpan rekomendasi (status: ${placeRes.status})`);
      }

      if (!placeRes.ok) {
        throw new Error(placeJson?.error || 'Gagal menyimpan rekomendasi');
      }

      setSubmitSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Submit error:', err);
      let msg = err.message || 'Terjadi kesalahan sistem saat mengirim rekomendasi.';
      if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        msg = 'Koneksi gagal ke server (Failed to fetch). Periksa jaringan internet Anda atau coba beberapa saat lagi.';
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleCloseModal = () => {
    reset();
    setSelectedPhotos([]);
    setStreetAddress('');
    setLandmark('');
    setHasUserEditedStreet(false);
    setStep(1);
    setSubmitSuccess(false);
    setSubmitError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Tambah Rekomendasi Tempat
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tanpa login. Berbagi kuliner enak untuk semua orang.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {submitSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Rekomendasi Berhasil Ditambahkan!</h3>
            <p className="text-sm text-slate-600 max-w-md mt-2 leading-relaxed">
              Terima kasih telah berbagi! Rekomendasi kuliner Anda sudah langsung tayang di peta dan dapat dilihat oleh semua orang.
            </p>
            <button
              type="button"
              onClick={handleCloseModal}
              className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition"
            >
              Lihat di Peta Sekarang
            </button>
          </div>
        ) : (
          <>
            {/* Step Progress Bar */}
            <div className="px-6 pt-3 pb-2 bg-white border-b border-slate-100">
              <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-slate-600">
                <span>Langkah {step} dari 4</span>
                <span className="text-blue-600">
                  {step === 1 && 'Info Tempat & Menu'}
                  {step === 2 && 'Pilih Lokasi di Peta'}
                  {step === 3 && 'Unggah Foto Makanan'}
                  {step === 4 && 'Cerita & Kirim'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Bot Honeypot (Visually Hidden) */}
              <input
                type="text"
                {...register('website_honeypot')}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Error banner */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nama Tempat Makan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Contoh: Warung Bebek Sinjay, Bakso Solo Samrat"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Menu Unggulan yang Wajib Dicoba <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('featured_food')}
                      placeholder="Contoh: Nasi Bebek Goreng Sambal Pencit, Bakso Urat Rusuk"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                    />
                    {errors.featured_food && (
                      <p className="text-xs text-red-500 mt-1">{errors.featured_food.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Kategori Kuliner <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('category')}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                      >
                        <option value="">Pilih Kategori...</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Perkiraan Rentang Harga
                      </label>
                      <select
                        {...register('price_range')}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                      >
                        {PRICE_RANGES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Location & Map Picker */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Map Pinning Section */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Tentukan Titik Tempat Makan di Peta</span>
                      </span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        Geser pin atau klik peta langsung
                      </span>
                    </label>

                    <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                      <MapComponent
                        pickerMode={true}
                        initialCoords={coords}
                        onCoordinatesChange={(newCoords) => {
                          setCoords(newCoords);
                          setValue('latitude', newCoords.lat);
                          setValue('longitude', newCoords.lng);

                          // Auto-detect street with debounce
                          if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
                          geocodeTimerRef.current = setTimeout(() => {
                            detectAddressFromCoords(newCoords.lat, newCoords.lng);
                          }, 350);
                        }}
                      />
                    </div>

                    {/* Auto-Detection Status Banner */}
                    <div className="mt-2">
                      {isDetectingAddress ? (
                        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200/60 animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                          <span>Mendeteksi nama jalan & area sekitar titik...</span>
                        </div>
                      ) : streetAddress ? (
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-1.5 truncate">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-[11px] text-slate-500 shrink-0">Jalan terdeteksi:</span>
                            <span className="font-semibold text-slate-800 truncate">{streetAddress}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => detectAddressFromCoords(coords.lat, coords.lng, true)}
                            title="Deteksi ulang dari titik peta"
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Deteksi Ulang</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Field 1: Auto-detected or edited street name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Nama Jalan / Area Terdekat <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                        Otomatis dari Peta
                      </span>
                    </div>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStreetAddress(val);
                        setHasUserEditedStreet(true);
                        const full = landmark.trim() ? `${val.trim()} (Patokan: ${landmark.trim()})` : val.trim();
                        setValue('address_text', full, { shouldValidate: true });
                      }}
                      placeholder="Mendeteksi jalan dari peta atau ketik manual..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                    />
                    {errors.address_text && !streetAddress && (
                      <p className="text-xs text-red-500 mt-1">{errors.address_text.message}</p>
                    )}
                  </div>

                  {/* Field 2: Landmark / Patokan Tambahan (Opsional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Patokan Lokasi <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLandmark(val);
                        const full = val.trim() ? `${streetAddress.trim()} (Patokan: ${val.trim()})` : streetAddress.trim();
                        setValue('address_text', full, { shouldValidate: true });
                      }}
                      placeholder="Contoh: Sebelah Indomaret, seberang masjid, tenda biru, dekat gapura RT 02"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bantu orang lain mengenali lokasi dengan patokan bangunan atau ciri warung.
                    </p>
                  </div>

                  {/* Live Combined Address Preview Card */}
                  {(streetAddress || landmark) && (
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-xs min-w-0">
                        <span className="text-[10px] uppercase font-bold text-blue-600 block">
                          Pratinjau Alamat Lengkap yang Tersimpan:
                        </span>
                        <p className="font-semibold text-slate-800 mt-0.5 break-words">
                          {streetAddress ? (
                            <>
                              {streetAddress}
                              {landmark.trim() && (
                                <span className="text-blue-700 font-medium"> (Patokan: {landmark.trim()})</span>
                              )}
                            </>
                          ) : (
                            landmark.trim()
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Photos Upload */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Foto Makanan atau Tempat Makan <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        {selectedPhotos.length}/5 Foto
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                      Bisa langsung jepret lewat kamera HP atau pilih dari galeri foto. Maksimal 5 foto.
                    </p>

                    {/* Quick Selection Buttons: Camera & Gallery */}
                    {selectedPhotos.length < 5 && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Direct Camera Button */}
                        <label
                          className={`flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-2xl border-2 border-dashed border-blue-400/80 bg-blue-50/70 hover:bg-blue-100 text-blue-700 cursor-pointer transition shadow-2xs group ${
                            isCompressing ? 'opacity-60 pointer-events-none' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-xs font-bold block text-blue-900 leading-tight">Buka Kamera</span>
                            <span className="text-[10px] text-blue-700/80 block truncate">Jepret foto langsung</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={isCompressing}
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>

                        {/* Gallery / File Picker Button */}
                        <label
                          className={`flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer transition shadow-2xs group ${
                            isCompressing ? 'opacity-60 pointer-events-none' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-xs font-bold block text-slate-900 leading-tight">Pilih dari Galeri</span>
                            <span className="text-[10px] text-slate-500 block truncate">Pilih dari album HP</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={isCompressing}
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {/* Compressing Indicator */}
                    {isCompressing && (
                      <div className="mb-3.5 p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center gap-2 text-xs text-blue-700 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                        <span>Sedang mengoptimalkan resolusi foto HP...</span>
                      </div>
                    )}

                    {/* Photo Grid Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-xs"
                        >
                          <img
                            src={photo.preview}
                            alt={`Foto preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-900/75 backdrop-blur-xs text-white rounded text-[10px] font-bold">
                            Foto #{index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition shadow-xs"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {selectedPhotos.length === 0 && (
                        <div className="col-span-2 sm:col-span-3 py-8 px-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                            <Upload className="w-6 h-6 stroke-[1.75]" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Belum ada foto yang dipilih</p>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                            Ketuk tombol <strong>Buka Kamera</strong> untuk memotret makanan sekarang, atau <strong>Pilih dari Galeri</strong> untuk mengunggah foto yang sudah tersimpan.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Review, Story & Contributor */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Deskripsi Pengalaman & Cita Rasa <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      placeholder="Bagaimana cita rasa makanannya? Apa yang bikin tempat ini spesial? Apakah tempatnya bersih atau ada jam ramai tertentu?"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition leading-relaxed"
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Contributor Identity Options */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <span className="block text-xs font-bold text-slate-800">Identitas Kontributor</span>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="anon_option"
                          checked={!isAnonymous}
                          onChange={() => {
                            setIsAnonymous(false);
                            setValue('is_anonymous', false);
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Tampilkan Nama Saya</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="anon_option"
                          checked={isAnonymous}
                          onChange={() => {
                            setIsAnonymous(true);
                            setValue('is_anonymous', true);
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Kirim sebagai Anonim</span>
                      </label>
                    </div>

                    {!isAnonymous && (
                      <div>
                        <input
                          type="text"
                          {...register('contributor_name')}
                          placeholder="Nama panggilan atau inisial Anda"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 transition"
                        />
                        {errors.contributor_name && (
                          <p className="text-xs text-red-500 mt-1">{errors.contributor_name.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isCompressing}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-xs rounded-xl shadow-xs transition ml-auto"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow-xs transition ml-auto"
                  >
                    {isSubmitting || isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isUploading ? 'Mengunggah Foto...' : 'Menyimpan...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Kirim Rekomendasi</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
