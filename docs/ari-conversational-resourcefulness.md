# Conversational resourcefulness

The shared persona now asks the primary model to infer conversational purpose,
choose an effective medium, use natural humor, adapt promptly to corrections,
and pursue useful alternatives when an approach fails. It applies to standard
and owner conversations, including the compact creative route. No new model
pass, worker, tool, or canned response catalog is added.

The safety classifier still detects the same signals. Its generated instructions
now identify keyword matches as hints to interpret in context instead of declaring
every mention a medical, crisis, or legal consultation. Real symptoms, credible
personal crises, and teen protections retain their existing guidance.

Run wiring and regression checks:

```sh
node --test tests/ari-vnext-resourcefulness.test.mjs tests/ari-vnext-conversation-reliability.test.mjs tests/ari-vnext-executive-consolidation.test.mjs tests/ari-vnext-age-entitlements.test.mjs
```

These mocked-provider checks establish instruction delivery, response preservation,
and call count, not actual wit or improved reasoning. Use the cases in
`tests/fixtures/ari-resourcefulness.json` for blind human comparison against the
previous revision with matched model, context, tools, and reasoning settings.
Score each rubric dimension 0–2, record latency and tokens, and repeat cases.
Do not report behavioral gains until real responses have been collected and rated.
The general prompt is deliberately free of example-specific substitution rules.
