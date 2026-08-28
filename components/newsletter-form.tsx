'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [status, setStatus] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: form.get('email') }),
    });
    setStatus(response.ok ? 'Thank you — you are on the list.' : 'Please enter a valid email address.');
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form className="newsletter-form" onSubmit={submit}>
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" name="email" type="email" required placeholder="Your email address" />
      <button type="submit">Join the list <span>→</span></button>
      <p aria-live="polite">{status}</p>
    </form>
  );
}
