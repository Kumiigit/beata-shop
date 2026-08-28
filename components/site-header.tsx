'use client';

import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from './cart-provider';

const links = [
  { href: '/shop?sort=newest', label: 'New arrivals' },
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'Our story' },
];

export function SiteHeader() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="announcement">Complimentary UK delivery on orders over £60</div>
      <header className="site-header">
        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <a className="brand" href="/" aria-label="Beata Shop home">
          <img src="/beata-logo.png" alt="Beata Shop" />
        </a>
        <nav aria-label="Main navigation">
          {links.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
        </nav>
        <div className="header-actions">
          <a href="/shop" aria-label="Search products"><Search aria-hidden="true" /> <span className="action-label">Search</span></a>
          <a href="/cart" aria-label={`Shopping bag, ${itemCount} items`}>
            <ShoppingBag aria-hidden="true" /> <span className="action-label">Bag</span>
            <strong>{itemCount}</strong>
          </a>
        </div>
      </header>
      <div className={`mobile-navigation ${menuOpen ? 'is-open' : ''}`} id="mobile-navigation">
        {links.map((link) => <a href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
        <a href="/contact" onClick={() => setMenuOpen(false)}>Contact</a>
      </div>
    </>
  );
}
