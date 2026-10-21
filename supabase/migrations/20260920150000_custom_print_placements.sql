ALTER TABLE custom_artwork ADD COLUMN IF NOT EXISTS print_type TEXT;
ALTER TABLE custom_artwork ADD COLUMN IF NOT EXISTS print_side TEXT;
ALTER TABLE custom_artwork ADD COLUMN IF NOT EXISTS placement_x INTEGER;
ALTER TABLE custom_artwork ADD COLUMN IF NOT EXISTS placement_y INTEGER;
ALTER TABLE custom_artwork ADD COLUMN IF NOT EXISTS fee_pence INTEGER;

UPDATE custom_artwork
SET
  print_type = COALESCE(print_type, 'a4'),
  print_side = COALESCE(print_side, CASE WHEN print_position = 'Back' THEN 'back' ELSE 'front' END),
  placement_x = COALESCE(placement_x, 50),
  placement_y = COALESCE(placement_y, 42),
  fee_pence = COALESCE(fee_pence, 400)
WHERE print_type IS NULL
   OR print_side IS NULL
   OR placement_x IS NULL
   OR placement_y IS NULL
   OR fee_pence IS NULL;

ALTER TABLE custom_artwork ALTER COLUMN print_type SET NOT NULL;
ALTER TABLE custom_artwork ALTER COLUMN print_side SET NOT NULL;
ALTER TABLE custom_artwork ALTER COLUMN placement_x SET NOT NULL;
ALTER TABLE custom_artwork ALTER COLUMN placement_y SET NOT NULL;
ALTER TABLE custom_artwork ALTER COLUMN fee_pence SET NOT NULL;

ALTER TABLE custom_artwork DROP CONSTRAINT IF EXISTS custom_artwork_print_type_check;
ALTER TABLE custom_artwork ADD CONSTRAINT custom_artwork_print_type_check CHECK (print_type IN ('logo', 'a4', 'a3'));
ALTER TABLE custom_artwork DROP CONSTRAINT IF EXISTS custom_artwork_print_side_check;
ALTER TABLE custom_artwork ADD CONSTRAINT custom_artwork_print_side_check CHECK (print_side IN ('front', 'back'));
ALTER TABLE custom_artwork DROP CONSTRAINT IF EXISTS custom_artwork_placement_x_check;
ALTER TABLE custom_artwork ADD CONSTRAINT custom_artwork_placement_x_check CHECK (placement_x BETWEEN 0 AND 100);
ALTER TABLE custom_artwork DROP CONSTRAINT IF EXISTS custom_artwork_placement_y_check;
ALTER TABLE custom_artwork ADD CONSTRAINT custom_artwork_placement_y_check CHECK (placement_y BETWEEN 0 AND 100);
ALTER TABLE custom_artwork DROP CONSTRAINT IF EXISTS custom_artwork_fee_pence_check;
ALTER TABLE custom_artwork ADD CONSTRAINT custom_artwork_fee_pence_check CHECK (fee_pence IN (200, 400, 600));
