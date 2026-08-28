import { NewsletterForm } from './newsletter-form';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src="/beata-logo.png" alt="Beata Shop" />
        <p>A quieter way to dress. Considered essentials for repeat wear.</p>
      </div>
      <div className="footer-links">
        <div><h3>Shop</h3><a href="/shop">All pieces</a><a href="/shop?sort=newest">New arrivals</a><a href="/shipping">Delivery</a><a href="/returns">Returns</a></div>
        <div><h3>About</h3><a href="/about">Our story</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
      </div>
      <div className="footer-newsletter">
        <p className="eyebrow">Notes from Beata</p>
        <h2>New pieces, quietly delivered.</h2>
        <NewsletterForm />
      </div>
      <div className="footer-bottom"><span>© 2026 Beata Shop</span><span>United Kingdom · GBP</span></div>
    </footer>
  );
}
