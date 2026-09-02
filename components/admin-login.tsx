'use client';
import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLogin() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [status, setStatus] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setStatus(''); const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) }); const data = await response.json().catch(() => ({})) as { error?: string }; if (response.ok) window.location.reload(); else { setStatus(data.error ?? 'Login failed.'); setLoading(false); } }
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}><span className="admin-lock"><LockKeyhole aria-hidden="true" /></span><p className="eyebrow">Beata Shop owner access</p><h1>Inventory login.</h1><p>Sign in to add products, update prices and control stock.</p><label>Email<Input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><Button className="shop-button" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Open inventory'}</Button><p className="checkout-error" role="alert">{status}</p></form></main>;
}
