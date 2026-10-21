import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { AdminLogin } from '@/components/admin-login';
import { adminSession } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/database';
import { ensureAnalyticsSchema } from '@/lib/analytics-db';
import './insights.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Shop insights', robots: { index: false, follow: false } };

type Total = { views: string; visitors: string; sessions: string; average_seconds: string | null; total_seconds: string | null };
type Day = { day: string; views: string; visitors: string };
type Page = { path: string; views: string; visitors: string; average_seconds: string | null };

const readReport = unstable_cache(async (days: number) => {
  await ensureAnalyticsSchema();
  const db = getDatabase();
  const [summary, daily, pages] = await Promise.all([
    db.sql<Total>`SELECT COUNT(*)::text AS views, COUNT(DISTINCT visitor_id)::text AS visitors,
      COUNT(DISTINCT session_id)::text AS sessions, AVG(engaged_seconds)::text AS average_seconds,
      SUM(engaged_seconds)::text AS total_seconds
      FROM public.analytics_page_views WHERE started_at >= now() - ${days} * interval '1 day'`,
    db.sql<Day>`SELECT to_char(started_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD') AS day,
      COUNT(*)::text AS views, COUNT(DISTINCT visitor_id)::text AS visitors
      FROM public.analytics_page_views WHERE started_at >= now() - ${days} * interval '1 day'
      GROUP BY 1 ORDER BY 1`,
    db.sql<Page>`SELECT path, COUNT(*)::text AS views, COUNT(DISTINCT visitor_id)::text AS visitors,
      AVG(engaged_seconds)::text AS average_seconds
      FROM public.analytics_page_views WHERE started_at >= now() - ${days} * interval '1 day'
      GROUP BY path ORDER BY COUNT(*) DESC, path LIMIT 20`,
  ]);
  return { totals: summary[0], daily, pages, updatedAt: new Date().toISOString() };
}, ['shop-insights-daily-v1'], { revalidate: 86400 });

function duration(seconds: number) {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.round(seconds % 3600 / 60)}m`;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const session = await adminSession();
  if (!session) return <AdminLogin />;
  const days = [7, 30, 90].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  let totals: Total | undefined;
  let daily: Day[] = [];
  let pages: Page[] = [];
  let updatedAt: string | undefined;
  let unavailable = !process.env.DATABASE_URL;
  if (!unavailable) {
    try {
      ({ totals, daily, pages, updatedAt } = await readReport(days));
    } catch (error) {
      console.error('Insights query failed:', error);
      unavailable = true;
    }
  }
  const maxViews = Math.max(1, ...daily.map((day) => Number(day.views)));
  const views = Number(totals?.views ?? 0);
  const average = Number(totals?.average_seconds ?? 0);

  return <main className="insights-page">
    <header className="insights-header"><div><p>Beata-shop.co / Admin</p><h1>Insights</h1><span>How consenting visitors use your shop.</span></div><nav aria-label="Admin links"><Link href="/admin/inventory">Inventory</Link><Link href="/shop">View shop</Link></nav></header>
    {unavailable ? <section className="insights-empty"><h2>Analytics storage is not ready</h2><p>Configure DATABASE_URL and apply the analytics migration to start collecting consented visits.</p></section> : <>
      <p className="insights-footnote">Reports refresh every 24 hours when opened. Last updated: {updatedAt ? new Date(updatedAt).toLocaleString('en-GB', { timeZone: 'Europe/London' }) : '—'} (UK time).</p>
      <nav className="insights-period" aria-label="Date range">{[7, 30, 90].map((range) => <a key={range} className={range === days ? 'selected' : ''} aria-current={range === days ? 'page' : undefined} href={`/admin/insights?days=${range}`}>Last {range} days</a>)}</nav>
      <section className="insights-cards" aria-label="Summary"><article><span>Page views</span><strong>{views.toLocaleString('en-GB')}</strong></article><article><span>Visitors</span><strong>{Number(totals?.visitors ?? 0).toLocaleString('en-GB')}</strong></article><article><span>Visits</span><strong>{Number(totals?.sessions ?? 0).toLocaleString('en-GB')}</strong></article><article><span>Avg. active time / page</span><strong>{duration(average)}</strong></article><article><span>Total active time</span><strong>{duration(Number(totals?.total_seconds ?? 0))}</strong></article></section>
      <section className="insights-panel"><div className="insights-title"><h2>Views over time</h2><p>Daily page views in UK time</p></div>{daily.length ? <figure className="insights-chart" aria-label="Daily page views">{daily.map((day) => <div className="insights-bar-item" key={day.day} title={`${day.day}: ${day.views} views, ${day.visitors} visitors`}><span>{day.views}</span><div className="insights-bar-track"><div style={{ height: `${Math.max(4, Number(day.views) / maxViews * 100)}%` }} /></div><small>{day.day.slice(5)}</small></div>)}</figure> : <p className="insights-no-data">No consented visits in this period yet.</p>}</section>
      <section className="insights-panel"><div className="insights-title"><h2>Top pages</h2><p>Where visitors spent their time</p></div>{pages.length ? <div className="insights-table-wrap"><table><thead><tr><th>Page</th><th>Views</th><th>Visitors</th><th>Avg. active time</th></tr></thead><tbody>{pages.map((page) => <tr key={page.path}><td><a href={page.path}>{page.path}</a></td><td>{Number(page.views).toLocaleString('en-GB')}</td><td>{Number(page.visitors).toLocaleString('en-GB')}</td><td>{duration(Number(page.average_seconds ?? 0))}</td></tr>)}</tbody></table></div> : <p className="insights-no-data">No pages to show yet.</p>}</section>
      <p className="insights-footnote">Only visits after analytics consent are counted. Active time increases while the page is visible and focused. Visitors are approximate browser identifiers; a person using multiple browsers may be counted more than once. Analytics begin after the database migration is applied.</p>
    </>}
  </main>;
}
