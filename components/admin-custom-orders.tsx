'use client';
import { useEffect, useState } from 'react';
import { Check, Clipboard, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatGBP } from '@/types/store';

type Artwork = { id: string; name: string; position: string };
type CustomOrder = {
  id: string;
  status: string;
  customer_email: string | null;
  total_pence: number;
  custom_status: string;
  proof_url: string | null;
  proof_response_due_at: string | null;
  proof_cancel_at: string | null;
  approval_token: string;
  created_at: string;
  product_name: string;
  size: string;
  quantity: number;
  artwork_json: Artwork[] | string;
};

function artworks(value: Artwork[] | string) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fetchCustomOrders(signal?: AbortSignal): Promise<{ orders: CustomOrder[]; error: string }> {
  const response = await fetch('/api/admin/orders', { signal });
  const data = await response.json();
  return { orders: response.ok ? data.orders : [], error: response.ok ? '' : (data.error ?? 'Custom orders could not be loaded.') };
}

export function AdminCustomOrders() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [status, setStatus] = useState('Loading custom orders…');
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  async function load(signal?: AbortSignal) {
    try {
      const data = await fetchCustomOrders(signal);
      if (signal?.aborted) return;
      setOrders(data.orders);
      setStatus(data.error);
    } catch {
      if (!signal?.aborted) setStatus('Custom orders could not be loaded.');
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetchCustomOrders(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setOrders(data.orders);
      setStatus(data.error);
    }).catch(() => {
      if (!controller.signal.aborted) setStatus('Custom orders could not be loaded.');
    });
    return () => controller.abort();
  }, []);
  async function update(orderId: string, action: string) {
    setStatus('Saving…');
    const response = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId, action, proofUrl: proofUrls[orderId] }),
    });
    const data = await response.json();
    setStatus(
      response.ok ? 'Order updated.' : (data.error ?? 'Update failed.'),
    );
    if (response.ok) await load();
  }
  function approvalLink(order: CustomOrder) {
    return `${window.location.origin}/proof/${order.approval_token}`;
  }
  return (
    <section className="custom-orders-panel" id="custom-orders">
      <div className="custom-orders-title">
        <div>
          <p className="eyebrow">Custom print workflow</p>
          <h2>Artwork &amp; proofs.</h2>
        </div>
        <Button variant="outline" onClick={() => { setStatus('Loading custom orders…'); void load(); }}>
          <RefreshCw /> Refresh
        </Button>
      </div>
      <p className="admin-status" ><output>
        {status}
      </output></p>
      {orders.length === 0 ? (
        <p>No custom-print orders yet.</p>
      ) : (
        <div className="custom-order-list">
          {orders.map((order) => {
            const files = artworks(order.artwork_json);
            const overdue =
              order.proof_cancel_at &&
              new Date(order.proof_cancel_at) <= new Date();
            return (
              <article
                className="custom-order"
                key={`${order.id}-${order.product_name}-${order.size}`}
              >
                <div className="custom-order-heading">
                  <div>
                    <span
                      className={`order-state state-${order.custom_status}`}
                    >
                      {order.custom_status.replaceAll('_', ' ')}
                    </span>
                    <h3>
                      {order.product_name} · {order.size} × {order.quantity}
                    </h3>
                    <p>
                      Order {order.id.slice(0, 8).toUpperCase()} ·{' '}
                      {formatGBP(order.total_pence)} ·{' '}
                      {order.customer_email ?? 'Email pending'}
                    </p>
                  </div>
                  <small>
                    {new Date(order.created_at).toLocaleDateString('en-GB')}
                  </small>
                </div>
                <div className="artwork-links">
                  {files.map((file) => (
                    <a
                      href={`/api/admin/artwork/${file.id}`}
                      target="_blank"
                      key={file.id}
                    >
                      <ExternalLink /> {file.name} · {file.position}
                    </a>
                  ))}
                </div>
                <div className="proof-controls">
                  <label>
                    Proof link
                    <input
                      type="url"
                      placeholder="https://…"
                      value={proofUrls[order.id] ?? order.proof_url ?? ''}
                      onChange={(event) =>
                        setProofUrls((current) => ({
                          ...current,
                          [order.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => update(order.id, 'proof_sent')}
                  >
                    Mark proof sent
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(approvalLink(order))
                    }
                  >
                    <Clipboard /> Copy approval link
                  </Button>
                </div>
                {order.proof_response_due_at && (
                  <p className="order-deadline">
                    48-hour response point:{' '}
                    {new Date(order.proof_response_due_at).toLocaleString(
                      'en-GB',
                    )}{' '}
                    · cancellation point:{' '}
                    {new Date(order.proof_cancel_at!).toLocaleString('en-GB')}
                  </p>
                )}
                <div className="order-actions">
                  {order.custom_status === 'approved' && (
                    <Button onClick={() => update(order.id, 'complete')}>
                      <Check /> Mark completed
                    </Button>
                  )}
                  {overdue &&
                    ![
                      'approved',
                      'completed',
                      'cancelled_no_approval',
                    ].includes(order.custom_status) && (
                      <Button
                        variant="destructive"
                        onClick={() => update(order.id, 'cancel_refund')}
                      >
                        Cancel &amp; refund
                      </Button>
                    )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
