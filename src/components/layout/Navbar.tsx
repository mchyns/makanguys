'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Bookmark, Compass } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';

interface NavbarProps {
  onOpenAddModal?: () => void;
}

export default function Navbar({ onOpenAddModal: _onOpenAddModal }: NavbarProps) {
  const pathname = usePathname();
  const { bookmarks } = useBookmarks();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              alt="MakanGuys Mascot Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-navy">
            Makan<span className="text-blue-600">Guys</span>
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              pathname === '/'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Jelajahi</span>
          </Link>

          <Link
            href="/tersimpan"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition relative ${
              pathname === '/tersimpan'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">Tersimpan</span>
            {bookmarks.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
