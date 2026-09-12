# ARI XP App Store Compliance Scope

This patch is intentionally narrow. It is not a redesign of ARI XP and does not change Ari Rebirth, Medical OS, nutrition, training, account deletion, or the existing AI-consent UX unless testing finds an actual review-blocking defect.

Release scope:

1. Keep obvious developer/test-only interfaces out of the production iOS bundle.
2. Synchronize public privacy wording with the current shipping ARI Circle location behavior and current iOS payment/support behavior.
3. Maintain one current release-specific App Store checklist for version 1.0 Build 7.
4. Verify—not replace—the existing AI-processing consent flow.
5. Prepare accurate App Store privacy, age-rating, reviewer-account, and Review Notes content.

Out of scope unless a test fails:

- Ari core reasoning or model-routing changes.
- New authentication architecture.
- New AI-consent architecture.
- New IAP/subscription implementation.
- Medical OS redesign.
- Circle redesign.
