'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'beata-admin-theme';
const CHANGE = 'beata-admin-theme-change';
let fallbackPreference: boolean | null = null;

function getSnapshot() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved === 'dark';
  } catch { /* Keep the theme usable when browser storage is unavailable. */ }
  return fallbackPreference ?? window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  media.addEventListener('change', onChange);
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE, onChange);
  return () => {
    media.removeEventListener('change', onChange);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE, onChange);
  };
}

function setTheme(dark: boolean) {
  fallbackPreference = dark;
  try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); }
  catch { /* Use the in-memory preference for this session. */ }
  window.dispatchEvent(new Event(CHANGE));
}

export function useAdminTheme() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return [dark, setTheme] as const;
}
