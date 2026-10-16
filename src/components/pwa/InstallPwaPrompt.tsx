'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare } from 'lucide-react';

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if already in standalone/installed mode
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if user dismissed previously in this session
    const dismissed = sessionStorage.getItem('makanguys_pwa_dismissed');
    if (dismissed) return;

    setIsDismissed(false);

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIos(true);
      return;
    }

    // Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('makanguys_pwa_dismissed', 'true');
    }
  };

  if (isDismissed || (!isInstallable && !isIos)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Toast Prompt for Mobile */}
      <div className="fixed bottom-18 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-88 z-40 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/icon.png"
              alt="MakanGuys App"
              className="w-10 h-10 rounded-xl bg-white shadow-xs shrink-0 object-cover"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Pasang Aplikasi MakanGuys</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Akses cepat dari layar utama HP tanpa buka browser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIos ? 'Cara Pasang di iPhone' : 'Pasang ke Layar Utama'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 text-xs text-slate-400 hover:text-white transition font-medium"
          >
            Nanti Saja
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm text-slate-900 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/icon.png" alt="MakanGuys" className="w-8 h-8 rounded-lg" />
                <h3 className="text-sm font-bold">Pasang di iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs text-slate-600 space-y-3 pl-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> di bar bawah Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  Gulir ke bawah lalu pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas. Icon MakanGuys akan langsung muncul di beranda HP Anda!
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
