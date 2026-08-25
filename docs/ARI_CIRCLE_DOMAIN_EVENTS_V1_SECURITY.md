# Domain Events V1 security boundary

The Domain Events ledger must remain an internal coordination mechanism. Direct authenticated table access is forbidden. Authenticated reads go through the bounded `ari_circle_list_domain_events(...)` RPC, which re-checks current Circle visibility and expiration before returning any event.

The ledger must not carry exact meeting points, user coordinates, message content, Mission proof notes, contact information, XP/reward state, payment/subscription state, popularity, or engagement signals.

Source tables remain authoritative. An event is never sufficient proof that an Opportunity is still active or visible.
