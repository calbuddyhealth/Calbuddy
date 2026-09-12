# ARI XP App Store Next Steps

1. Exclude `ari-lab.html` from the production iOS bundle.
2. Update the Privacy Notice location wording so it matches current ARI Circle discovery/meetup behavior rather than legacy Buddies-only language.
3. Update the Privacy Notice iOS support/payment wording so it matches the current shipping native build, where optional support is unavailable unless a compliant StoreKit flow is enabled.
4. Add or update a smoke assertion proving `ari-lab.html` is not present in the generated native bundle.
5. Run CI and review the exact diff before merging.
6. After merge, verify App Store Connect privacy and age-rating answers against the release checklist before uploading Build 7.
