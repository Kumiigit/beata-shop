'use client';

import Image from 'next/image';
import logo from '@/public/beata-logo.png';
import Link from 'next/link';
import { STORE } from '@/lib/store-config';
import { useLanguage } from './language-provider';

export function SiteFooter() {
  const isPolish = useLanguage() === 'pl';

  return <footer className="site-footer">
    <div className="footer-brand"><Image src={logo} sizes="260px" alt="Beata Shop" /><p>{isPolish ? 'Zabawne nadruki i wygodne ubrania dla osób, które mają coś do powiedzenia.' : 'Funny text and genuinely wearable clothes for people with something to say.'}</p></div>
    <div className="footer-links"><div><h3>{isPolish ? 'Sklep' : 'Shop'}</h3><Link prefetch={false} href="/shop">{isPolish ? 'Wszystkie produkty' : 'All products'}</Link><Link prefetch={false} href="/custom-print">{isPolish ? 'Własny nadruk' : 'Custom printing'}</Link><Link prefetch={false} href="/shipping">{isPolish ? 'Dostawa' : 'Delivery'}</Link><Link prefetch={false} href="/returns">{isPolish ? 'Zwroty' : 'Returns'}</Link></div><div><h3>{isPolish ? 'Informacje' : 'Information'}</h3><Link prefetch={false} href="/about">{isPolish ? 'O nas' : 'Our story'}</Link><Link prefetch={false} href="/contact">{isPolish ? 'Kontakt' : 'Contact'}</Link><Link prefetch={false} href="/privacy">{isPolish ? 'Prywatność i pliki cookie' : 'Privacy & cookies'}</Link><button type="button" className="footer-cookie-settings" onClick={() => window.dispatchEvent(new Event('beata:cookie-settings'))}>{isPolish ? 'Ustawienia analityki' : 'Analytics settings'}</button><Link prefetch={false} href="/terms">{isPolish ? 'Regulamin' : 'Terms'}</Link><Link prefetch={false} href="/cancellation-form">{isPolish ? 'Formularz odstąpienia' : 'Cancellation form'}</Link></div></div>
    <div className="footer-contact"><p className="eyebrow">{isPolish ? 'Obsługa klienta' : 'Customer care'}</p><h2>{isPolish ? 'Potrzebujesz pomocy?' : 'Need a hand?'}</h2><a href={`mailto:${STORE.email}`}>{STORE.email}</a><a href={`tel:${STORE.phoneHref}`}>{STORE.phoneDisplay}</a><p>{isPolish ? 'Poniedziałek–sobota, 9:00–17:00 (czas UK)' : STORE.supportHours}</p></div>
    <div className="footer-bottom"><span>© 2026 {STORE.legalName}, {isPolish ? `działająca jako ${STORE.tradingName}` : `trading as ${STORE.tradingName}`}</span><span>{isPolish ? 'Wielka Brytania · GBP · Firma niezarejestrowana jako podatnik VAT' : 'Great Britain · GBP · Not VAT registered'}</span></div>
  </footer>;
}
