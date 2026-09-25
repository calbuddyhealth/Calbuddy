import assert from "node:assert/strict";
import test from "node:test";

import { deriveBehavioralIdentityControl } from "../api/_lib/ari-vnext/behavioral-identity.js";
import { contextToText } from "../api/_lib/ari-vnext/context-router.js";

test("behavioral identity control reaches the model-facing relevant context", () => {
  const behavioralIdentity = deriveBehavioralIdentityControl({
    turn: { message: "What do you think about adding another service?" },
    route: { developer: true },
    context: {}
  });

  const text = contextToText({
    userWorldModel: {
      ariCognitiveWorkspace: {
        behavioralIdentity
      }
    }
  });

  assert.match(text, /ARI BEHAVIORAL IDENTITY CONTROL/);
  assert.match(text, /decision priors, not dogma/i);
  assert.match(text, /simplest architecture/i);
  assert.match(text, /Do not mention this control layer/i);
});
