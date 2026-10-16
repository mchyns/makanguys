'use client';

import React from 'react';
import { CATEGORIES, PRICE_RANGES, SORT_OPTIONS } from '@/lib/constants';
import { RotateCcw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedPriceRange: string;
  onSelectPriceRange: (range: string) => void;
  selectedSort: string;
  onSelectSort: (sort: any) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  totalCount?: number;
}

export default function FilterBar({
  selectedCategory,
  onSelectCategory,
  selectedPriceRange,
  onSelectPriceRange,
  selectedSort,
  onSelectSort,
  onReset,
  hasActiveFilters,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Category Pills (Horizontal scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          Semua Kategori
        </button>

        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Price, Sort & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {/* Price Range Filter */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPriceRange}
              onChange={(e) => onSelectPriceRange(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium text-xs focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">Semua Harga</option>
              {PRICE_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSort}
              onChange={(e) => onSelectSort(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium text-xs focus:outline-hidden focus:border-blue-500"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalCount !== undefined && (
            <span className="text-slate-500 text-xs font-medium">
              {totalCount} tempat ditemukan
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
