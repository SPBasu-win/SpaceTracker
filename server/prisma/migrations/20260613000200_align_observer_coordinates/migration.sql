ALTER TABLE observer_profiles
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6);

UPDATE observer_profiles
SET
  latitude = ST_Y(tracking_location::geometry),
  longitude = ST_X(tracking_location::geometry)
WHERE tracking_location IS NOT NULL
  AND latitude IS NULL
  AND longitude IS NULL;

ALTER TABLE observer_profiles
  ALTER COLUMN latitude SET NOT NULL,
  ALTER COLUMN longitude SET NOT NULL;

ALTER TABLE observer_profiles
  DROP COLUMN IF EXISTS tracking_location;

CREATE INDEX IF NOT EXISTS idx_observer_profiles_coordinates
  ON observer_profiles (latitude, longitude);
