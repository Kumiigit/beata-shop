'use client';

import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from './cart-provider';

const links = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?sort=newest', label: 'New arrivals' },
  { href: '/#cat-club', label: 'Cat club' },
  { href: '/#custom-print', label: 'Custom print' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  return <>
    <div className="cat-topbar"><span>Made for cat people</span><span>Complimentary UK delivery over £60</span><a href="mailto:hello@beata-shop.co">hello@beata-shop.co</a></div>
    <header className="site-header cat-header">
      <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
      <a className="brand" href="/" aria-label="Beata Shop home"><img src="/beata-logo.png" alt="Beata Shop" /></a>
      <nav aria-label="Main navigation">{links.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}</nav>
      <div className="header-actions"><a className="search-pill" href="/shop" aria-label="Search products"><span>Search</span><Search aria-hidden="true" /></a><a href="/cart" aria-label={`Shopping bag, ${itemCount} items`}><ShoppingBag aria-hidden="true" /><strong>{itemCount}</strong></a></div>
    </header>
    <div className={`mobile-navigation ${menuOpen ? 'is-open' : ''}`} id="mobile-navigation">{links.map((link) => <a href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>)}</div>
  </>;
}
