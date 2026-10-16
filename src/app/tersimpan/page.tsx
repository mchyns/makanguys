'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PlaceCard from '@/components/places/PlaceCard';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Bookmark, Trash2, ArrowLeft, Info, Compass, Loader2 } from 'lucide-react';

function TersimpanContent() {
  const { bookmarks, isLoaded, clearBookmarks } = useBookmarks();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-12 flex-1 flex flex-col gap-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-slate-400 hover:text-slate-600 transition p-1 -ml-1 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600 fill-current" />
                <span>Tempat Makan Tersimpan</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Koleksi tempat makan favorit yang Anda simpan untuk dikunjungi nanti.
            </p>
          </div>

          {bookmarks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus semua tempat yang tersimpan?')) {
                  clearBookmarks();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>

        {/* Local Storage Notice */}
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pemberitahuan Penyimpanan Lokal: </span>
            Daftar tempat tersimpan ini disimpan secara privat di memori peramban (browser) perangkat Anda tanpa memerlukan login. Apabila Anda menghapus data situs atau berganti peramban, daftar ini tidak akan tersinkronisasi.
          </div>
        </div>

        {/* Places Grid or Empty State */}
        {!isLoaded ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Memuat daftar tersimpan...
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center my-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Belum Ada Tempat yang Disimpan</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
              Tekan ikon simpan pada kartu atau halaman detail tempat makan untuk menyimpannya ke daftar ini.
            </p>
            <Link
              href="/"
              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Compass className="w-4 h-4" />
              <span>Jelajahi Peta Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookmarks.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function TersimpanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <TersimpanContent />
    </Suspense>
  );
}

