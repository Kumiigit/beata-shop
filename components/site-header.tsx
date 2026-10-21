'use client';

import Image from 'next/image';
import logo from '@/public/beata-logo.png';
import Link from 'next/link';
import { ArrowRight, Ghost, Menu, Search, Shirt, ShoppingBag, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './cart-provider';
import { useLanguage } from './language-provider';
import type { Language } from '@/lib/i18n';

const navigation = {
  en: [
    { href: '/', label: 'Home' }, { href: '/shop', label: 'Shop' }, { href: '/workwear', label: 'Workwear' }, { href: '/shop?sort=newest', label: 'New arrivals' },
    { href: '/#special-edition', label: 'Special edition' }, { href: '/custom-print', label: 'Custom print' },
    { href: '/about', label: 'About us' }, { href: '/contact', label: 'Contact' },
  ],
  pl: [
    { href: '/', label: 'Strona główna' }, { href: '/shop', label: 'Sklep' }, { href: '/workwear', label: 'Odzież robocza' }, { href: '/shop?sort=newest', label: 'Nowości' },
    { href: '/#special-edition', label: 'Edycja specjalna' }, { href: '/custom-print', label: 'Własny nadruk' },
    { href: '/about', label: 'O nas' }, { href: '/contact', label: 'Kontakt' },
  ],
} satisfies Record<Language, { href: string; label: string }[]>;

export function SiteHeader() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const language = useLanguage();
  const pathname = usePathname();
  const promoteCustomPrints = pathname === '/' || pathname === '/shop' || pathname.startsWith('/shop/');

  function switchLanguage(nextLanguage: Language) {
    document.cookie = `beata_language=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  const links = navigation[language];
  const copy = language === 'pl'
    ? { delivery: 'Darmowa dostawa od £60', madeToOrder: 'Każdy produkt robimy na zamówienie', search: 'Szukaj...', navigation: 'Nawigacja sklepu', home: 'Strona główna Beata Shop', bag: 'Koszyk', language: 'Wybierz język', closeMenu: 'Zamknij menu', openMenu: 'Otwórz menu', items: 'produktów' }
    : { delivery: 'Free delivery over £60', madeToOrder: 'Every product is made to order', search: 'Search...', navigation: 'Shop navigation', home: 'Beata Shop home', bag: 'Shopping bag', language: 'Choose language', closeMenu: 'Close menu', openMenu: 'Open menu', items: 'items' };

  return <>
    <div className="cat-topbar halloween-topbar">
      <fieldset style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }} className="language-switch"  aria-label={copy.language}>
        <button type="button" className={language === 'en' ? 'is-active' : ''} aria-pressed={language === 'en'} onClick={() => switchLanguage('en')}>English</button>
        <span aria-hidden="true">·</span>
        <button type="button" className={language === 'pl' ? 'is-active' : ''} aria-pressed={language === 'pl'} onClick={() => switchLanguage('pl')}>Polski</button>
      </fieldset>
      <a href="tel:+447385305287">+44 7385 305287</a><span>{copy.madeToOrder}</span><span>{copy.delivery}</span>
    </div>
    <header className="site-header cat-header halloween-header">
      <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? copy.closeMenu : copy.openMenu} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
      <Link prefetch={false} className="brand" href="/" aria-label={copy.home}><Image src={logo} sizes="260px" loading="eager" alt="Beata Shop" /></Link>
      <nav aria-label={copy.navigation}>{links.map((link) => <Link prefetch={false} href={link.href} key={`${link.href}-${link.label}`}>{link.label}</Link>)}</nav>
      <div className="header-actions">
        <search><form className="search-pill header-search-form" action="/shop" method="get" >
          <label className="sr-only" htmlFor="header-product-search">{copy.search}</label>
          <input id="header-product-search" name="q" type="search" placeholder={copy.search} />
          <button type="submit" aria-label={copy.search}><Search aria-hidden="true" /></button>
        </form></search>
        <Link prefetch={false} href="/cart" aria-label={`${copy.bag}, ${itemCount} ${copy.items}`}><ShoppingBag aria-hidden="true" /><strong>{itemCount}</strong></Link>
      </div>
    </header>
    <div className={`halloween-season-ribbon${promoteCustomPrints ? ' has-custom-print-shortcut' : ''}`}><Ghost aria-hidden="true" /><span>{language === 'pl' ? 'Halloween w Beata Shop' : 'Spooky season at Beata Shop'}</span><Ghost aria-hidden="true" /></div>
    {promoteCustomPrints && <Link prefetch={false} href="/custom-print" className="mobile-custom-print-shortcut">
      <Shirt aria-hidden="true" />
      <span className="mobile-custom-print-copy"><strong>{language === 'pl' ? 'Własny nadruk' : 'Custom prints'}</strong><small>{language === 'pl' ? 'Twój tekst, zdjęcie lub projekt' : 'Your text, photo or design'}</small></span>
      <span className="mobile-custom-print-action">{language === 'pl' ? 'Stwórz swój' : 'Create yours'}<ArrowRight aria-hidden="true" /></span>
    </Link>}
    <div className={`mobile-navigation ${menuOpen ? 'is-open' : ''}`} id="mobile-navigation">
      <search><form className="mobile-search-form" action="/shop" method="get" >
        <label className="sr-only" htmlFor="mobile-product-search">{copy.search}</label>
        <input id="mobile-product-search" name="q" type="search" placeholder={copy.search} />
        <button type="submit" aria-label={copy.search}><Search aria-hidden="true" /></button>
      </form></search>
      {links.map((link) => <Link prefetch={false} href={link.href} key={`${link.href}-${link.label}`} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
    </div>
  </>;
}
