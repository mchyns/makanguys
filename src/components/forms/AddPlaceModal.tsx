'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlaceSubmissionSchema, PlaceSubmissionInput } from '@/lib/validations/place';
import { CATEGORIES, PRICE_RANGES, DEFAULT_MAP_CENTER } from '@/lib/constants';
import { compressImage } from '@/lib/utils/image';
import MapComponent from '../map/MapComponent';
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
} from 'lucide-react';

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

  if (!isOpen) return null;

  // Handle Photo selection & validation with client-side compression
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
      const newPhotos: { file: File; preview: string }[] = [];
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          alert(`Format berkas ${file.name} tidak didukung. Harap pilih JPEG, PNG, atau WebP.`);
          continue;
        }

        // Compress image using canvas to ensure payload is tiny (~150-250KB) and avoids Vercel 4.5MB limit
        const compressed = await compressImage(file, 1200, 0.8);
        newPhotos.push({
          file: compressed,
          preview: URL.createObjectURL(compressed),
        });
      }

      const updated = [...selectedPhotos, ...newPhotos];
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
      // 1. Upload photos first
      setIsUploading(true);
      const formData = new FormData();
      for (const p of selectedPhotos) {
        // Double check compression before uploading
        const fileToUpload = p.file.size > 800 * 1024 ? await compressImage(p.file, 1200, 0.8) : p.file;
        formData.append('files', fileToUpload);
      }

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

      // 2. Submit place metadata
      const payload = {
        ...values,
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
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nama Area atau Patokan Alamat Singkat <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('address_text')}
                      placeholder="Contoh: Jl. Kebon Sirih Barat No. 9, Menteng (sebelah minimarket)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                    />
                    {errors.address_text && (
                      <p className="text-xs text-red-500 mt-1">{errors.address_text.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Tentukan Titik Koordinat di Peta</span>
                      </span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        Geser pin atau klik peta langsung
                      </span>
                    </label>

                    <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                      <MapComponent
                        pickerMode={true}
                        initialCoords={coords}
                        onCoordinatesChange={(newCoords) => {
                          setCoords(newCoords);
                          setValue('latitude', newCoords.lat);
                          setValue('longitude', newCoords.lng);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Photos Upload */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Foto Makanan atau Tempat Makan <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Unggah foto asli makanan atau suasana warung. Maksimal 5 foto (JPEG, PNG, WebP
                      hingga 5 MB per foto).
                    </p>

                    {/* Photo Grid Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 group bg-slate-100"
                        >
                          <img
                            src={photo.preview}
                            alt={`Foto preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
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

                      {selectedPhotos.length < 5 && (
                        <label className={`aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer transition p-4 text-center ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}>
                          {isCompressing ? (
                            <>
                              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1" />
                              <span className="text-xs font-semibold text-slate-700">Mengoptimalkan Foto...</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Kompresi resolusi HP</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-1" />
                              <span className="text-xs font-semibold text-slate-700">Pilih / Jepret Foto</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WebP</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            disabled={isCompressing}
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
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
