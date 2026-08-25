// ARI vNext — combined server-grounded Circle initiative source.
// The mature Domain Event + matched-spot loader remains unchanged in
// circle-event-initiative-core.js. Crew candidacy is loaded independently from
// its own guarded user-scoped RPC and attached as a separate evidence packet.

import {
  CIRCLE_EVENT_INITIATIVE_VERSION as CORE_CIRCLE_EVENT_INITIATIVE_VERSION,
  loadCircleInitiativeEvents as loadCoreCircleInitiativeEvents,
  compactDirectEvent,
  compactMatchedSpotEvent
} from "./circle-event-initiative-core.js";
import { loadCrewInitiativeCandidates } from "./crew-initiative.js";

export const CIRCLE_EVENT_INITIATIVE_VERSION = "1.2.0";
export const CORE_CIRCLE_EVENT_INITIATIVE_VERSION = CORE_CIRCLE_EVENT_INITIATIVE_VERSION;
export { compactDirectEvent, compactMatchedSpotEvent };

export async function loadCircleInitiativeEvents({ accessToken, userId, now = new Date(), limit } = {}) {
  const [events, crewCandidates] = await Promise.all([
    loadCoreCircleInitiativeEvents({ accessToken, userId, now, limit }),
    loadCrewInitiativeCandidates({ accessToken, now, limit: 3 })
  ]);

  return {
    ...events,
    version: CIRCLE_EVENT_INITIATIVE_VERSION,
    crewCandidates,
    rules: {
      ...(events?.rules && typeof events.rules === "object" ? events.rules : {}),
      crewCandidatesUseSeparateGuardedRpc: true,
      crewCandidateBrowserContextIsNotAuthority: true,
      crewCandidateMutationAuthority: false
    }
  };
}
