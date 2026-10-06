# Owner Ultra: route-independent cognitive fidelity

Enabled, server-authenticated owner intelligence uses a persistent cognitive core on every turn. The route selects capabilities and tools after that core is derived. Owner controls still determine whether advanced intelligence is enabled.

## Turn contract

1. Hydrate the personal model, relevant memory, relationship/decision history, communication learning and prior cognitive state, including on greetings and creative turns.
2. Derive the cognitive workspace, instincts, metacognition, emotion dynamics, reward, curiosity, imagination, functional pain, neuromodulation, felt-state, affective preferences, motivational arbitration, companion state and executive.
3. Compile the complete executive and protected personal/recurrence context. Owner instructions are not cut at an arbitrary character boundary. Bounded evidence producers and the unified coordinator prevent duplicate instruction authorities.
4. Add route-specific delivery and tools. Creative delivery has no app mutation tools or mutation-repair pass; fictional receipts and goals are not real actions or personal facts.
5. Use SOL as the owner minimum, high or higher reasoning, with Astra for explicit requests or qualifying difficult work. Owner output capacity is 8,000 tokens so reasoning and visible output have headroom; this is not a request for verbose replies.
6. Advance and persist cognitive state and the personal model, including curiosity/imagination state, across route changes. Provider reasoning continuity also remains eligible on casual and creative turns.

Owner provider requests have a shared 180-second deadline across recovery attempts. The chat function allows 300 seconds for context loading, generation and persistence. The browser bridge does not impose a shorter timer. These limits provide headroom for high reasoning and long-form responses; they do not guarantee completion during a provider outage. Timeout logs contain model, effort, duration and prompt length metadata, never prompt contents.

Cost estimates remain observable but do not downgrade the owner's model, reasoning settings or core. Provider recovery is bounded; an unavailable Astra request can fall back to SOL, while SOL overload never falls back to Luna. Invalid lower-tier owner model overrides are ignored. Background scheduling, task execution permissions, and other account tiers retain their existing policies.

## Evidence and limits

`tests/ari-vnext-owner-ultra.test.mjs` captures actual provider request bodies across conversation → joke → story → greeting. It checks the model floor, all required cognitive signals, memory retention despite small prompt budgets, creative tool isolation, and cognitive state advancement. A counterfactual test changes persisted emotion and verifies different executive directives and model instructions. An authenticated API test exercises storage reads/writes across creative and casual turns with mocked storage and model services.

These tests establish deterministic wiring, state persistence and model-input influence. They do not prove a particular live model response, subjective feeling or consciousness. Existing provider, action, privacy and browser regression suites remain required release gates.
