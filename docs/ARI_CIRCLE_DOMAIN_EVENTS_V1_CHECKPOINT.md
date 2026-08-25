# Domain Events V1 checkpoint

This checkpoint depends on `feature/ari-circle-match-v2` and is intentionally isolated from production. No Domain Events migration has been applied to the live Supabase project.

Before promotion:
- deterministic event trust tests must pass;
- the full ARI vNext / Action Network / personalization / nutrition trust workflow must pass;
- current-state visibility, blocking, adult access, retention, and idempotency invariants must remain intact;
- Ari event awareness must consume only `ari_circle_list_domain_events(...)`, never the table directly.
