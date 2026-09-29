-- Prevent retries from double-counting the same provider request in Ari's cost ledger.
-- Applied to production Supabase as migration 20260929035455.

create unique index if not exists ai_provider_usage_provider_request_unique_idx
  on public.ai_provider_usage_logs (provider, provider_request_id);
