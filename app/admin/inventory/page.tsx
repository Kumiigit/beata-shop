import type { Metadata } from 'next';
import { AdminLogin } from '@/components/admin-login';
import { AdminInventory } from '@/components/admin-inventory';
import { adminSession } from '@/lib/admin-auth';
import { listProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Inventory admin', robots: { index: false, follow: false } };

export default async function InventoryPage() { const session = await adminSession(); if (!session) return <AdminLogin />; const products = await listProducts(true); return <AdminInventory initialProducts={products} email={session.email} />; }
