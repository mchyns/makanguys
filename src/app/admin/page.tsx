'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Place, Report } from '@/types';
import { formatDateIndo, formatPriceRange } from '@/lib/utils/format';
import { CATEGORIES } from '@/lib/constants';
import {
  ShieldCheck,
  Lock,
  LogOut,
  Check,
  X,
  EyeOff,
  Trash2,
  ExternalLink,
  RefreshCw,
  Loader2,
  MapPin,
  Utensils,
  User,
  Filter,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data: Default to 'all' (Semua Rekomendasi) since recommendations are auto-published
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'reports'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Check auth on load
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch Admin Data
  const fetchAdminData = async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      if (activeTab === 'reports') {
        const res = await fetch('/api/admin/reports?status=all');
        const data = await res.json();
        if (res.ok) setReports(data.data || []);
      } else {
        const queryStatus = activeTab === 'pending' ? 'pending' : statusFilter;
        const res = await fetch(`/api/admin/places?status=${queryStatus}`);
        const data = await res.json();
        if (res.ok) setPlaces(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch admin data', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated, activeTab, statusFilter]);

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password admin salah');
      }

      setIsAuthenticated(true);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  // Status Action Handler
  const handleUpdateStatus = async (id: string, newStatus: 'published' | 'rejected' | 'hidden' | 'pending') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/places/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh local list
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal memperbarui status');
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Place Handler
  const handleDeletePlace = async (id: string, name: string) => {
    if (!confirm(`Hapus permanen tempat makan "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/places/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      } else {
        alert('Gagal menghapus tempat');
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Report Resolution Handler
  const handleUpdateReport = async (id: string, newStatus: 'resolved' | 'dismissed') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchAdminData();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Initial Auth Loading State
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Login View if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="text-xl font-bold text-center text-slate-900">Panel Moderasi MakanGuys</h1>
          <p className="text-xs text-center text-slate-500 mt-1 mb-6">
            Khusus moderator. Masukkan password admin server untuk melanjutkan.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Admin</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Masuk ke Panel Moderasi</span>
            </button>

            {/* Quick dev hint helper */}
            <div className="pt-2 text-center text-[11px] text-slate-400">
              Password bawaan pengujian lokal: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">makanguysadmin2026</code>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
              ← Kembali ke Beranda Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white px-4 sm:px-8 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Moderasi MakanGuys</h1>
            <p className="text-[11px] text-slate-400">Panel Kurasi & Pencegahan Spam</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <span>Buka Web Publik</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={fetchAdminData}
            title="Refresh Data"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Semua Rekomendasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Antrean Pending</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Laporan Pengguna</span>
              {reports.filter((r) => r.status === 'pending').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {reports.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* Status Sub-filter for 'all' tab */}
          {activeTab === 'all' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="published">Diterbitkan (Published)</option>
                <option value="pending">Menunggu (Pending)</option>
                <option value="rejected">Ditolak (Rejected)</option>
                <option value="hidden">Disembunyikan (Hidden)</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Table / List */}
        {isLoadingData ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-semibold">Memuat data moderasi...</p>
          </div>
        ) : activeTab === 'reports' ? (
          // REPORTS TAB
          reports.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
              Tidak ada laporan tempat makan saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          rep.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : rep.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rep.status}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Alasan: {rep.reason}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Tempat:</strong>{' '}
                      {rep.place ? (
                        <Link
                          href={`/tempat/${rep.place.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          {rep.place.name} ({rep.place.address_text})
                        </Link>
                      ) : (
                        `ID: ${rep.place_id}`
                      )}
                    </p>

                    {rep.description && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg mt-1">
                        &quot;{rep.description}&quot;
                      </p>
                    )}

                    <span className="text-[10px] text-slate-400 block">
                      Dilaporkan pada {formatDateIndo(rep.created_at)}
                    </span>
                  </div>

                  {/* Resolution Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {rep.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateReport(rep.id, 'resolved')}
                          disabled={actionLoadingId === rep.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Tandai Selesai
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateReport(rep.id, 'dismissed')}
                          disabled={actionLoadingId === rep.id}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          Abaikan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // PLACES TAB (Pending or All)
          places.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
              Tidak ada data tempat makan dalam antrean ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {places.map((place) => {
                const photo = place.photos?.[0]?.url || place.photos?.[0]?.storage_path;
                const categoryLabel =
                  CATEGORIES.find((c) => c.id === place.category)?.label || place.category;

                return (
                  <div
                    key={place.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row gap-5"
                  >
                    {/* Thumbnail */}
                    <div className="w-full md:w-44 h-32 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                      {photo ? (
                        <img src={photo} alt={place.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          Tanpa Foto
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {categoryLabel}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-base">{place.name}</h3>
                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              place.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : place.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : place.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {place.status}
                          </span>
                        </div>

                        <p className="text-blue-600 font-semibold text-xs flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Menu: {place.featured_food}</span>
                        </p>

                        <p className="text-slate-600 text-xs mt-1.5 leading-relaxed line-clamp-2">
                          {place.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{place.address_text}</span>
                          </span>
                          <span>{formatPriceRange(place.price_range, place.price_min, place.price_max)}</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>
                              {place.is_anonymous || !place.contributor_name
                                ? 'Anonim'
                                : place.contributor_name}
                            </span>
                          </span>
                          <span>{formatDateIndo(place.created_at)}</span>
                        </div>
                      </div>

                      {/* Moderation Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                        {place.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(place.id, 'published')}
                            disabled={actionLoadingId === place.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Setujui & Publikasikan</span>
                          </button>
                        )}

                        {place.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(place.id, 'rejected')}
                            disabled={actionLoadingId === place.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        )}

                        {place.status !== 'hidden' && place.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(place.id, 'hidden')}
                            disabled={actionLoadingId === place.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Sembunyikan</span>
                          </button>
                        )}

                        <Link
                          href={`/tempat/${place.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition ml-auto"
                        >
                          <span>Lihat Halaman</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeletePlace(place.id, place.name)}
                          disabled={actionLoadingId === place.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
}
