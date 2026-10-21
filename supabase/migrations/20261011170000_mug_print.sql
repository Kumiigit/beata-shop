ALTER TABLE custom_artwork DROP CONSTRAINT IF EXISTS custom_artwork_print_type_check;
ALTER TABLE custom_artwork ADD CONSTRAINT custom_artwork_print_type_check CHECK (print_type IN ('logo', 'a4', 'a3', 'mug'));
ALTER TABLE variants ALTER COLUMN print_area_width_cm TYPE NUMERIC(5,2);
ALTER TABLE variants ALTER COLUMN print_area_height_cm TYPE NUMERIC(5,2);
ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_print_area_width_check;
ALTER TABLE variants ADD CONSTRAINT variants_print_area_width_check CHECK (print_area_width_cm BETWEEN 1 AND 80);
ALTER TABLE variants DROP CONSTRAINT IF EXISTS variants_print_area_height_check;
ALTER TABLE variants ADD CONSTRAINT variants_print_area_height_check CHECK (print_area_height_cm BETWEEN 1 AND 100);
