'use client';
import { useState, useEffect, useCallback } from 'react';

const KEY = '__devTime';
const EVENT = '__devTimeChanged';

function readStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

function makeNow(hhmm: string | null): Date {
  if (!hhmm) return new Date();
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  // WIB = UTC+7, jadi UTC = WIB - 7
  const utcH = ((h - 7) + 24) % 24;
  d.setUTCHours(utcH, m, 0, 0);
  return d;
}

export function useDevTime() {
  const [devTime, setDevTimeState] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setDevTimeState(readStorage());
  }, []);

  useEffect(() => {
    // Sync saat mount (SSR-safe)
    refresh();
    window.addEventListener(EVENT, refresh);
    return () => window.removeEventListener(EVENT, refresh);
  }, [refresh]);

  const setDevTime = useCallback((hhmm: string | null) => {
    if (hhmm) localStorage.setItem(KEY, hhmm);
    else localStorage.removeItem(KEY);
    setDevTimeState(hhmm);
    // Broadcast ke semua komponen yang pakai hook ini
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return {
    devTime,
    setDevTime,
    now: makeNow(devTime),
    isActive: devTime !== null,
  };
}
