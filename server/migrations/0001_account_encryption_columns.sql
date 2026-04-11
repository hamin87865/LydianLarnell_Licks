ALTER TABLE musician_applications ADD COLUMN IF NOT EXISTS account_number_encrypted TEXT;
ALTER TABLE musician_applications ADD COLUMN IF NOT EXISTS account_number_last4 TEXT;
CREATE INDEX IF NOT EXISTS musician_applications_status_created_idx ON musician_applications (status, created_at DESC);
