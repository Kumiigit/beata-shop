'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from './language-provider';

type Choice = 'yes' | 'no' | null;
const preference = 'beata_analytics_consent';
const visitor = 'beata_analytics_visitor';

function cookie(name: string) {
  return document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))?.split('=')[1];
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

export function AnalyticsConsent() {
  const language = useLanguage();
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const saved = cookie(preference);
    queueMicrotask(() => {
      setChoice(saved === 'yes' || saved === 'no' ? saved : null);
      setReady(true);
    });
    const open = () => setSettingsOpen(true);
    window.addEventListener('beata:cookie-settings', open);
    return () => window.removeEventListener('beata:cookie-settings', open);
  }, []);

  useEffect(() => {
    if (!ready || choice !== 'yes' || pathname.startsWith('/admin') || pathname.startsWith('/proof')) return;
    let visitorId = cookie(visitor);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      setCookie(visitor, visitorId, 60 * 60 * 24 * 180);
    }
    let sessionId = sessionStorage.getItem('beata_analytics_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('beata_analytics_session', sessionId);
    }
    const viewId = crypto.randomUUID();
    const path = pathname.replace(/\/$/, '') || '/';
    let seconds = 0;
    let sent = -1;
    const send = (beacon = false) => {
      if (seconds === sent) return;
      sent = seconds;
      const payload = JSON.stringify({ viewId, sessionId, path, seconds });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', new Blob([payload], { type: 'application/json' }));
      } else {
        void fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
      }
    };
    send();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) seconds += 1;
    }, 1000);
    const hide = () => send(true);
    const visibility = () => { if (document.visibilityState === 'hidden') send(true); };
    window.addEventListener('pagehide', hide);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', hide);
      document.removeEventListener('visibilitychange', visibility);
      if (cookie(preference) === 'yes') send(true);
    };
  }, [choice, pathname, ready]);

  function choose(next: 'yes' | 'no') {
    setCookie(preference, next, 60 * 60 * 24 * 180);
    if (next === 'no') {
      setCookie(visitor, '', 0);
      sessionStorage.removeItem('beata_analytics_session');
    }
    setChoice(next);
    setSettingsOpen(false);
  }

  if (!ready || pathname.startsWith('/admin') || (!settingsOpen && choice !== null)) return null;
  const pl = language === 'pl';
  return <aside className="cookie-panel" aria-label={pl ? 'Ustawienia analityki' : 'Analytics settings'}>
    <div><strong>{pl ? 'Prywatność ma znaczenie' : 'Your privacy matters'}</strong><p>{pl ? 'Za Twoją zgodą mierzymy odwiedziny i czas aktywnego przeglądania. Możesz odmówić i nadal korzystać ze sklepu. Zmień wybór w stopce.' : 'With your permission, we measure page visits and active time on the shop. You can decline and still use the shop. Change your choice in the footer.'} <Link href="/privacy">{pl ? 'Dowiedz się więcej' : 'Learn more'}</Link>.</p></div>
    <div className="cookie-actions"><button type="button" onClick={() => choose('no')}>{pl ? 'Odrzuć analitykę' : 'Reject analytics'}</button><button type="button" className="cookie-accept" onClick={() => choose('yes')}>{pl ? 'Akceptuj analitykę' : 'Accept analytics'}</button></div>
  </aside>;
}
