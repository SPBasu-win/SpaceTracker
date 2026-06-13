CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE asset_class AS ENUM (
  'COMMUNICATION',
  'NAVIGATION',
  'EARTH_OBSERVATION',
  'WEATHER',
  'MILITARY',
  'SCIENTIFIC',
  'CREWED',
  'DEBRIS',
  'OTHER'
);

CREATE TYPE illumination_state AS ENUM (
  'SUNLIT',
  'PENUMBRA',
  'ECLIPSED',
  'UNKNOWN'
);

CREATE TABLE orbital_assets (
  asset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_number integer NOT NULL,
  international_designator text,
  display_name text,
  asset_class asset_class NOT NULL,
  operator_name text,
  origin_country text,
  launch_date date,
  decay_date date,
  orbital_epoch timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_orbital_assets_catalog_number UNIQUE (catalog_number),
  CONSTRAINT chk_orbital_assets_catalog_number_positive CHECK (catalog_number > 0),
  CONSTRAINT chk_orbital_assets_date_order CHECK (decay_date IS NULL OR launch_date IS NULL OR decay_date >= launch_date)
);

CREATE TABLE orbital_elements_archive (
  archive_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  element_line_1 varchar(69) NOT NULL,
  element_line_2 varchar(69) NOT NULL,
  epoch_timestamp timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_orbital_elements_archive_asset
    FOREIGN KEY (asset_id) REFERENCES orbital_assets(asset_id) ON DELETE CASCADE,
  CONSTRAINT uq_orbital_elements_archive_asset_epoch UNIQUE (asset_id, epoch_timestamp),
  CONSTRAINT chk_orbital_elements_archive_tle_line_1 CHECK (element_line_1 ~ '^1 [ 0-9A-Z]{5}[A-Z ]'),
  CONSTRAINT chk_orbital_elements_archive_tle_line_2 CHECK (element_line_2 ~ '^2 [ 0-9A-Z]{5} ')
);

CREATE TABLE observer_profiles (
  observer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_email text NOT NULL,
  tracking_location geography(Point,4326) NOT NULL,
  preferred_asset_id uuid,
  minimum_visibility_angle numeric(5,2) NOT NULL DEFAULT 10.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_observer_profiles_preferred_asset
    FOREIGN KEY (preferred_asset_id) REFERENCES orbital_assets(asset_id) ON DELETE SET NULL,
  CONSTRAINT chk_observer_profiles_contact_email
    CHECK (contact_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  CONSTRAINT chk_observer_profiles_minimum_visibility_angle
    CHECK (minimum_visibility_angle >= 0 AND minimum_visibility_angle <= 90)
);

CREATE TABLE visibility_windows (
  window_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  acquisition_time timestamptz NOT NULL,
  loss_time timestamptz NOT NULL,
  peak_elevation numeric(5,2) NOT NULL,
  approach_sector varchar(32),
  illumination_state illumination_state NOT NULL DEFAULT 'UNKNOWN',
  visibility_rating integer NOT NULL,
  notification_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_visibility_windows_observer
    FOREIGN KEY (observer_id) REFERENCES observer_profiles(observer_id) ON DELETE CASCADE,
  CONSTRAINT fk_visibility_windows_asset
    FOREIGN KEY (asset_id) REFERENCES orbital_assets(asset_id) ON DELETE CASCADE,
  CONSTRAINT chk_visibility_windows_time_order CHECK (loss_time > acquisition_time),
  CONSTRAINT chk_visibility_windows_rating CHECK (visibility_rating BETWEEN 0 AND 100),
  CONSTRAINT chk_visibility_windows_peak_elevation CHECK (peak_elevation BETWEEN 0 AND 90)
);

CREATE TABLE tracked_assets (
  tracking_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_tracked_assets_observer
    FOREIGN KEY (observer_id) REFERENCES observer_profiles(observer_id) ON DELETE CASCADE,
  CONSTRAINT fk_tracked_assets_asset
    FOREIGN KEY (asset_id) REFERENCES orbital_assets(asset_id) ON DELETE CASCADE,
  CONSTRAINT uq_tracked_assets_observer_asset UNIQUE (observer_id, asset_id)
);

CREATE TABLE observation_logs (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  observation_location geography(Point,4326) NOT NULL,
  observation_time timestamptz NOT NULL,
  tracking_duration_seconds integer NOT NULL,
  signal_quality integer NOT NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_observation_logs_observer
    FOREIGN KEY (observer_id) REFERENCES observer_profiles(observer_id) ON DELETE CASCADE,
  CONSTRAINT fk_observation_logs_asset
    FOREIGN KEY (asset_id) REFERENCES orbital_assets(asset_id) ON DELETE CASCADE,
  CONSTRAINT chk_observation_logs_signal_quality CHECK (signal_quality BETWEEN 0 AND 10),
  CONSTRAINT chk_observation_logs_tracking_duration CHECK (tracking_duration_seconds >= 0)
);

CREATE TABLE interaction_records (
  record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id uuid NOT NULL,
  conversation_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_interaction_records_observer
    FOREIGN KEY (observer_id) REFERENCES observer_profiles(observer_id) ON DELETE CASCADE,
  CONSTRAINT chk_interaction_records_conversation_payload_object
    CHECK (jsonb_typeof(conversation_payload) = 'object'),
  CONSTRAINT chk_interaction_records_session_context_object
    CHECK (jsonb_typeof(session_context) = 'object')
);

CREATE INDEX idx_orbital_assets_catalog_number ON orbital_assets (catalog_number);
CREATE INDEX idx_orbital_assets_asset_class ON orbital_assets (asset_class);
CREATE INDEX idx_orbital_assets_operator_name ON orbital_assets (operator_name);
CREATE INDEX idx_orbital_assets_updated_at ON orbital_assets (updated_at);

CREATE INDEX idx_orbital_elements_archive_asset_epoch
  ON orbital_elements_archive (asset_id, epoch_timestamp DESC);

CREATE INDEX idx_observer_profiles_contact_email ON observer_profiles (contact_email);
CREATE INDEX idx_observer_profiles_preferred_asset_id ON observer_profiles (preferred_asset_id);
CREATE INDEX idx_observer_profiles_tracking_location_gist
  ON observer_profiles USING gist (tracking_location);

CREATE INDEX idx_visibility_windows_observer_acquisition
  ON visibility_windows (observer_id, acquisition_time);
CREATE INDEX idx_visibility_windows_asset_acquisition
  ON visibility_windows (asset_id, acquisition_time);
CREATE INDEX idx_visibility_windows_notification_sent
  ON visibility_windows (notification_sent);

CREATE INDEX idx_tracked_assets_observer_id ON tracked_assets (observer_id);
CREATE INDEX idx_tracked_assets_asset_id ON tracked_assets (asset_id);

CREATE INDEX idx_observation_logs_observer_time
  ON observation_logs (observer_id, observation_time DESC);
CREATE INDEX idx_observation_logs_asset_time
  ON observation_logs (asset_id, observation_time DESC);
CREATE INDEX idx_observation_logs_observation_location_gist
  ON observation_logs USING gist (observation_location);

CREATE INDEX idx_interaction_records_observer_created
  ON interaction_records (observer_id, created_at DESC);
CREATE INDEX idx_interaction_records_conversation_payload_gin
  ON interaction_records USING gin (conversation_payload);
CREATE INDEX idx_interaction_records_session_context_gin
  ON interaction_records USING gin (session_context);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orbital_assets_set_updated_at
  BEFORE UPDATE ON orbital_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_observer_profiles_set_updated_at
  BEFORE UPDATE ON observer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_interaction_records_set_updated_at
  BEFORE UPDATE ON interaction_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
