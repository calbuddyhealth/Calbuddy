# Domain Events V1 PR notes

Base: `feature/ari-circle-match-v2`

This layer adds a privacy-bounded, 30-day coordination ledger for Action Network state changes. It does not change production navigation, does not apply migrations to the live Supabase project, and does not make events durable Ari social memory.

Validation target:
- Action Network deterministic tests
- Domain Events trust regressions
- existing Ari vNext / personalization / nutrition trust suite

Promotion remains blocked until CI is green and the migration is reviewed against current source-authority transitions.
