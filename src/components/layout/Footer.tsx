import React from 'react';
import Link from 'next/link';
import { MapPin, ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-10 px-4 sm:px-6 lg:px-8 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <MapPin className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base tracking-tight">MakanGuys</h3>
            <p className="text-slate-400 text-xs">Peta rekomendasi kuliner berbasis komunitas Indonesia.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span>Daftar tersimpan disimpan aman di browser Anda.</span>
          <Link href="/admin" className="hover:text-blue-400 flex items-center gap-1 transition">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Moderasi</span>
          </Link>
        </div>

        <div className="text-xs text-slate-500 text-center md:text-right">
          <p>© 2026 MakanGuys. Temukan yang enak, tandai tempatnya.</p>
        </div>
      </div>
    </footer>
  );
}
