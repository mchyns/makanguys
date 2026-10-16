'use client';

import React, { useState } from 'react';
import { Place } from '@/types';
import { REPORT_REASONS } from '@/lib/constants';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface ReportModalProps {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ place, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].id);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: place.id,
          reason,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim laporan');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Laporkan Tempat Makan</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-bold text-slate-900 text-base">Laporan Telah Diterima</h4>
            <p className="text-xs text-slate-600 mt-2">
              Terima kasih telah membantu menjaga akurasi informasi MakanGuys. Tim kami akan segera meninjau tempat ini.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            <div>
              <p className="text-slate-500 mb-1">Melaporkan tempat:</p>
              <p className="font-bold text-slate-900 text-sm line-clamp-1">{place.name}</p>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Alasan Pelaporan</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Catatan Tambahan (Opsional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Contoh: Sudah pindah alamat ke jalan sebelah atau tutup permanen..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Kirim Laporan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
