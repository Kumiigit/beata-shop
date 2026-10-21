ALTER TABLE variants ADD COLUMN IF NOT EXISTS print_area_width_cm NUMERIC(5,1) NOT NULL DEFAULT 40.4;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS print_area_height_cm NUMERIC(5,1) NOT NULL DEFAULT 65.0;

ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_print_area_width_check;
ALTER TABLE variants ADD CONSTRAINT variants_print_area_width_check CHECK (print_area_width_cm BETWEEN 30 AND 80);
ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_print_area_height_check;
ALTER TABLE variants ADD CONSTRAINT variants_print_area_height_check CHECK (print_area_height_cm BETWEEN 43 AND 100);

ALTER TABLE custom_artwork ADD COLUMN IF NOT EXISTS variant_id TEXT REFERENCES variants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_custom_artwork_variant ON custom_artwork(variant_id);
