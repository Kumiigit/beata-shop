ALTER TABLE custom_artwork
  ADD COLUMN IF NOT EXISTS print_orientation TEXT;

UPDATE custom_artwork
SET print_orientation = 'portrait'
WHERE print_orientation IS NULL;

ALTER TABLE custom_artwork
  ALTER COLUMN print_orientation SET DEFAULT 'portrait',
  ALTER COLUMN print_orientation SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_artwork_print_orientation_check'
  ) THEN
    ALTER TABLE custom_artwork
      ADD CONSTRAINT custom_artwork_print_orientation_check
      CHECK (print_orientation IN ('portrait', 'landscape'));
  END IF;
END $$;
