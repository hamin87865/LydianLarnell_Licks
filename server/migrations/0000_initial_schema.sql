CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'basic',
  upgrade_request_status TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT,
  profile_image TEXT,
  bio TEXT,
  email TEXT,
  instagram TEXT,
  layout TEXT DEFAULT 'horizontal',
  language TEXT DEFAULT 'ko',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_nickname_change BIGINT
);

CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  video_url TEXT,
  video_file TEXT,
  pdf_file TEXT,
  pdf_file_name TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_sanctioned BOOLEAN NOT NULL DEFAULT FALSE,
  sanction_reason TEXT,
  sanctioned_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS musician_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  category TEXT NOT NULL,
  email TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_number_encrypted TEXT,
  account_number_last4 TEXT,
  account_holder TEXT,
  video_file_name TEXT NOT NULL,
  video_size BIGINT,
  video_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  signed_contract_file_name TEXT,
  signed_contract_size BIGINT,
  signed_contract_path TEXT,
  contract_checked BOOLEAN NOT NULL DEFAULT FALSE,
  rejected_reason TEXT,
  admin_memo TEXT
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notify BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_id)
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KRW',
  order_name TEXT NOT NULL,
  payment_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'toss',
  raw_payload JSONB,
  raw_prepare_payload JSONB,
  raw_confirm_payload JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_code TEXT,
  failure_message TEXT,
  expired_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  reason TEXT,
  request_ip TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id TEXT,
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL,
  request_ip TEXT,
  user_agent TEXT,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  reason TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verifications (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_requests (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_settlement_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (musician_user_id, year, month)
);

CREATE TABLE IF NOT EXISTS monthly_settlement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0,
  payout_amount INTEGER NOT NULL DEFAULT 0,
  platform_revenue INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (musician_user_id, year, month)
);

CREATE INDEX IF NOT EXISTS payment_orders_user_status_created_idx ON payment_orders (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_orders_user_content_idx ON payment_orders (user_id, content_id);
CREATE INDEX IF NOT EXISTS contents_author_created_idx ON contents (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contents_category_created_idx ON contents (category, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_user_content_idx ON purchases (user_id, content_id);
CREATE INDEX IF NOT EXISTS musician_applications_status_created_idx ON musician_applications (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_order_id_unique_idx ON payment_orders (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_payment_key_unique_idx ON payment_orders (payment_key) WHERE payment_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS purchases_payment_order_id_unique_idx ON purchases (payment_order_id) WHERE payment_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS monthly_settlement_status_year_month_idx ON monthly_settlement_status (year, month, status);
CREATE INDEX IF NOT EXISTS monthly_settlement_snapshots_year_month_idx ON monthly_settlement_snapshots (year, month, status);
