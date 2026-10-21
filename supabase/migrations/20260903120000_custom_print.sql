ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_response_due_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_cancel_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_approved_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approval_token TEXT UNIQUE;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_print BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS artwork_fee_pence INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS artwork_json JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS custom_artwork (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  storage_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  print_position TEXT NOT NULL,
  rights_confirmed_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_after TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_custom_artwork_cleanup ON custom_artwork(delete_after);
CREATE INDEX IF NOT EXISTS idx_custom_artwork_order ON custom_artwork(order_id);
