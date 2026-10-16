'use client';

import { useState, useEffect, useCallback } from 'react';
import { Place } from '@/types';

const STORAGE_KEY = 'makanguys_bookmarks_v1';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Place[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load bookmarks from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveBookmarks = useCallback((newBookmarks: Place[]) => {
    setBookmarks(newBookmarks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks to localStorage', e);
    }
  }, []);

  const toggleBookmark = useCallback(
    (place: Place) => {
      const exists = bookmarks.some((p) => p.id === place.id);
      if (exists) {
        const updated = bookmarks.filter((p) => p.id !== place.id);
        saveBookmarks(updated);
        return false;
      } else {
        const updated = [place, ...bookmarks];
        saveBookmarks(updated);
        return true;
      }
    },
    [bookmarks, saveBookmarks]
  );

  const isBookmarked = useCallback(
    (placeId: string) => {
      return bookmarks.some((p) => p.id === placeId);
    },
    [bookmarks]
  );

  const clearBookmarks = useCallback(() => {
    saveBookmarks([]);
  }, [saveBookmarks]);

  return {
    bookmarks,
    isLoaded,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
  };
}
