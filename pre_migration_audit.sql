-- Pre-migration: ensure audit infrastructure exists and required extensions are enabled
-- Safe to run multiple times

-- Enable pgcrypto for gen_random_uuid() used by other scripts
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create audit_logs table if not exists (generic schema compatible with trigger usage)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           BIGSERIAL PRIMARY KEY,
  table_name   TEXT NOT NULL,
  operation    TEXT NOT NULL,
  record_id    TEXT,
  new_values   JSONB,
  "timestamp"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create or replace the audit trigger function that writes to audit_logs
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, operation, record_id, new_values, "timestamp")
  VALUES (TG_TABLE_NAME, TG_OP, COALESCE((NEW).id::text, NULL), to_jsonb(NEW), NOW());
  RETURN NEW;
END;
$$;
