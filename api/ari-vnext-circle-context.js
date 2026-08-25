// ARI vNext — read-only Action Network context boundary.
// Uses the signed-in user's JWT for every Circle RPC so adult access, blocking,
// and source-RPC authorization remain authoritative. No service-role fallback.

const VERSION = "1.5.1";
const MAX_OPPORTUNITIES = 12;
const MAX_INTENTS = 3;
const MAX_MATCH_INTENTS = 3;
const MAX_MATCHES_PER_INTENT = 6;
const MAX_RELATIONSHIPS = 8;
const MAX_PLACES = 8;
const MAX_DOMAIN_EVENTS = 16;
const MAX_CONTEXT_EVENTS = 8;
const MAX_ACTIONABLE_EVENTS = 5;
const MAX_CREWS = 6;
const MAX_CREW_CANDIDATES = 4;
const MAX_CREW_MEMBERS = 8;

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_circle_context" });
  }

  const accessToken = bearerToken(req?.headers?.authorization);
  if (!accessToken) {
    return res.status(401).json({
      success: false,
      available: false,
      code: "AUTH_TOKEN_MISSING",
      error: "A signed-in ARI session is required.",
      source: "ari_vnext_circle_context"
    });
  }

  const config = supabaseConfig();
  if (!config) {
    return res.status(503).json({
      success: false,
      available: false,
      code: "CIRCLE_CONTEXT_UNAVAILABLE",
      error: "ARI Circle context is not configured.",
      source: "ari_vnext_circle_context"
    });
  }

  try {
    const ageState = await callRpc(config, accessToken, "ari_circle_my_age_state", {});
    if (ageState?.circle_allowed !== true) {
      return res.status(200).json({
        success: true,
        available: false,
        locked: true,
        reason: "circle_not_allowed",
        version: VERSION,
        source: "guarded_circle_rpcs"
      });
    }

    const viewerId = jwtSubject(accessToken);
    const [opportunitiesRaw, intentsRaw, relationshipsRaw, domainEventsRaw, crewsRaw, crewCandidatesRaw] = await Promise.all([
      callRpc(config, accessToken, "ari_circle_list_opportunities", {
        requested_types: ["meetup", "mission"],
        requested_activity: null,
        requested_window: "upcoming",
        result_limit: MAX_OPPORTUNITIES
      }),
      callRpc(config, accessToken, "ari_circle_list_my_action_intents", {
        include_inactive: false,
        result_limit: MAX_INTENTS
      }),
      callOptionalActionNetworkRpc(config, accessToken, "ari_circle_list_action_relationships", {
        result_limit: MAX_RELATIONSHIPS
      }),
      callOptionalActionNetworkRpc(config, accessToken, "ari_circle_list_domain_events", {
        requested_since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        result_limit: MAX_DOMAIN_EVENTS
      }),
      callOptionalActionNetworkRpc(config, accessToken, "ari_circle_list_my_crews", {
        result_limit: MAX_CREWS
      }),
      callOptionalActionNetworkRpc(config, accessToken, "ari_circle_list_crew_candidates", {
        result_limit: MAX_CREW_CANDIDATES
      })
    ]);

    const opportunities = array(opportunitiesRaw).map(compactOpportunity).filter(Boolean);
    const activeIntents = array(intentsRaw).map(compactIntent).filter(Boolean);
    const relationships = array(relationshipsRaw).map(compactRelationship).filter(Boolean);
    const crews = array(crewsRaw).map(compactCrew).filter(Boolean).slice(0, MAX_CREWS);
    const crewCandidates = array(crewCandidatesRaw).map(compactCrewCandidate).filter(Boolean).slice(0, MAX_CREW_CANDIDATES);
    const recentEvents = array(domainEventsRaw)
      .map((row) => compactDomainEvent(row, viewerId))
      .filter(Boolean);

    const matchBatches = await Promise.all(
      activeIntents.slice(0, MAX_MATCH_INTENTS).map(async (intent) => {
        try {
          const rows = await callRpc(config, accessToken, "ari_circle_match_opportunities", {
            requested_intent_id: intent.intentId,
            result_limit: MAX_MATCHES_PER_INTENT
          });
          return array(rows).map((row) => compactMatch(row, intent.intentId)).filter(Boolean);
        } catch (error) {
          if (isMissingActionNetworkRpc(error)) return [];
          throw error;
        }
      })
    );

    const placeBatches = await Promise.all(
      activeIntents.slice(0, MAX_MATCH_INTENTS).map(async (intent) => {
        try {
          const rows = await callOptionalActionNetworkRpc(config, accessToken, "ari_circle_list_places_for_intent", {
            requested_intent_id: intent.intentId,
            result_limit: MAX_PLACES
          });
          return array(rows).map((row) => compactPlace(row, intent.intentId)).filter(Boolean);
        } catch (error) {
          if (isMissingActionNetworkRpc(error)) return [];
          throw error;
        }
      })
    );

    const bestMatches = dedupeMatches(matchBatches.flat()).slice(0, 10);
    const places = dedupePlaces(placeBatches.flat()).slice(0, MAX_PLACES);
    const eventAwareness = deriveEventAwareness({ recentEvents, bestMatches, opportunities });
    const situation = buildSituation({
      opportunities,
      activeIntents,
      bestMatches,
      relationships,
      places,
      crews,
      crewCandidates,
      recentEvents: eventAwareness.recentEvents,
      actionableEvents: eventAwareness.actionableEvents
    });

    return res.status(200).json({
      success: true,
      available: true,
      version: VERSION,
      source: "guarded_circle_rpcs",
      generatedAt: new Date().toISOString(),
      ...situation,
      eventAwareness: {
        version: "circle_event_awareness_v1",
        initiativeNotAutomatic: true,
        selfGeneratedActionsSuppressed: true,
        genericCreationEventsNotInitiativeEligible: true,
        spotOpenRequiresCurrentMatch: true,
        crewLifecycleContextOnlyUntilDedicatedInitiativeGate: true
      },
      crewAwareness: {
        version: "circle_crew_awareness_v1",
        candidateEvidenceMinimumCompletions: 2,
        rawCandidateMemberIdsIncluded: false,
        publicCrewDiscoveryIncluded: false,
        arbitraryGroupSuggestionsIncluded: false,
        crewCreationAuthorityIncluded: false
      },
      privacy: {
        exactMeetingPointsIncluded: false,
        directMessagesIncluded: false,
        rawCoordinatesIncluded: false,
        rawPlaceCoordinatesIncluded: false,
        rawFeedContentIncluded: false,
        durableSocialLearningIncluded: false,
        missionProofNotesIncluded: false,
        missionReviewerIdentitiesIncluded: false,
        rawDomainEventMetadataIncluded: false,
        domainEventsPersistedAsAriMemory: false,
        rawCrewTablesIncluded: false,
        rawCrewCandidateMemberIdsIncluded: false
      }
    });
  } catch (error) {
    const missing = isMissingActionNetworkRpc(error);
    const status = missing ? 200 : normalizeStatus(error?.status);
    return res.status(status).json({
      success: missing,
      available: false,
      code: missing ? "ACTION_NETWORK_NOT_MIGRATED" : "CIRCLE_CONTEXT_READ_FAILED",
      error: missing ? undefined : clean(error?.message, 400) || "ARI could not read Circle context.",
      version: VERSION,
      source: "ari_vnext_circle_context"
    });
  }
}

export function buildSituation({
  opportunities = [],
  activeIntents = [],
  bestMatches = [],
  relationships = [],
  places = [],
  crews = [],
  crewCandidates = [],
  recentEvents = [],
  actionableEvents = []
} = {}) {
  const schedule = opportunities.filter((item) => [
    "host", "joined", "pending", "waitlisted", "creator", "submitted", "verified", "completed"
  ].includes(item.viewerState)).slice(0, 8);

  const hostPendingRequestCount = opportunities.reduce((total, item) => {
    if (item.viewerState !== "host") return total;
    return total + Math.max(0, number(item.pendingRequestCount) || 0);
  }, 0);

  const repeatRelationshipCount = relationships.reduce(
    (total, relationship) => total + ((number(relationship?.completedTogether) || 0) >= 2 ? 1 : 0),
    0
  );

  const activeMetricMissionCount = opportunities.reduce((total, item) => {
    if (item?.type !== "mission" || !item?.mission) return total;
    return total + (item.mission.objectiveType && item.mission.objectiveType !== "completion" ? 1 : 0);
  }, 0);

  const crewInviteCount = crews.reduce(
    (total, crew) => total + (crew?.viewerStatus === "invited" ? 1 : 0),
    0
  );
  const activeCrewCount = crews.reduce(
    (total, crew) => total + (crew?.status === "active" && crew?.viewerStatus === "active" ? 1 : 0),
    0
  );

  return {
    summary: {
      opportunityCount: opportunities.length,
      activeIntentCount: activeIntents.length,
      bestMatchCount: bestMatches.length,
      scheduledCount: schedule.length,
      hostPendingRequestCount,
      relationshipCount: relationships.length,
      repeatRelationshipCount,
      activeMetricMissionCount,
      placeSuggestionCount: places.length,
      crewCount: crews.length,
      activeCrewCount,
      crewInviteCount,
      crewCandidateCount: crewCandidates.length,
      recentEventCount: recentEvents.length,
      actionableEventCount: actionableEvents.length
    },
    activeIntents,
    bestMatches,
    relationships: relationships.slice(0, MAX_RELATIONSHIPS),
    places: places.slice(0, MAX_PLACES),
    crews: crews.slice(0, MAX_CREWS),
    crewCandidates: crewCandidates.slice(0, MAX_CREW_CANDIDATES),
    recentEvents: recentEvents.slice(0, MAX_CONTEXT_EVENTS),
    actionableEvents: actionableEvents.slice(0, MAX_ACTIONABLE_EVENTS),
    schedule,
    opportunities: opportunities.slice(0, 10)
  };
}

export function deriveEventAwareness({ recentEvents = [], bestMatches = [], opportunities = [] } = {}) {
  const matchedSubjectIds = new Set(
    bestMatches.map((item) => clean(item?.id, 120)).filter(Boolean)
  );
  const currentSubjectIds = new Set(
    opportunities.map((item) => clean(item?.id, 120)).filter(Boolean)
  );

  const seen = new Set();
  const compact = [];
  const actionable = [];

  for (const event of recentEvents) {
    if (!event?.eventId || seen.has(event.eventId)) continue;
    seen.add(event.eventId);

    const subjectIsCurrent = currentSubjectIds.has(event.subjectId);
    const subjectIsMatched = matchedSubjectIds.has(event.subjectId);
    const classified = classifyEventAwareness(event, { subjectIsCurrent, subjectIsMatched });
    if (!classified.includeInContext) continue;

    const next = {
      ...event,
      priority: classified.priority,
      initiativeEligible: classified.initiativeEligible,
      relevanceReason: classified.reason
    };
    compact.push(next);
    if (classified.initiativeEligible) actionable.push(next);
  }

  const sorted = compact.sort(eventSort);
  const actionableSorted = actionable.sort(eventSort);
  return {
    recentEvents: sorted.slice(0, MAX_CONTEXT_EVENTS),
    actionableEvents: actionableSorted.slice(0, MAX_ACTIONABLE_EVENTS)
  };
}

function classifyEventAwareness(event = {}, { subjectIsCurrent = false, subjectIsMatched = false } = {}) {
  const type = clean(event?.type, 80);
  const selfGenerated = event?.actorIsViewer === true;

  if (selfGenerated) {
    return {
      includeInContext: true,
      initiativeEligible: false,
      priority: "context",
      reason: "self_generated_action"
    };
  }

  if (type === "meetup.accepted") {
    return { includeInContext: true, initiativeEligible: true, priority: "high", reason: "host_accepted_request" };
  }
  if (type === "meetup.cancelled") {
    return { includeInContext: true, initiativeEligible: true, priority: "high", reason: "joined_or_hosted_meetup_cancelled" };
  }
  if (type === "meetup.declined") {
    return { includeInContext: true, initiativeEligible: true, priority: "medium", reason: "host_declined_request" };
  }
  if (type === "meetup.waitlisted") {
    return { includeInContext: true, initiativeEligible: true, priority: "medium", reason: "request_waitlisted" };
  }
  if (type === "meetup.requested") {
    return { includeInContext: true, initiativeEligible: true, priority: "medium", reason: "host_request_needs_attention" };
  }
  if (type === "mission.progress_verified") {
    return { includeInContext: true, initiativeEligible: true, priority: "positive", reason: "mission_progress_verified" };
  }
  if (type === "mission.progress_rejected") {
    return { includeInContext: true, initiativeEligible: true, priority: "medium", reason: "mission_progress_rejected" };
  }
  if (type === "mission.progress_submitted") {
    return { includeInContext: true, initiativeEligible: true, priority: "medium", reason: "mission_progress_needs_review" };
  }
  if (type === "mission.objective_reached") {
    return { includeInContext: true, initiativeEligible: true, priority: "positive", reason: "mission_objective_reached" };
  }
  if (type === "meetup.spot_opened") {
    return {
      includeInContext: subjectIsMatched,
      initiativeEligible: subjectIsMatched,
      priority: "medium",
      reason: subjectIsMatched ? "matched_opportunity_spot_opened" : "unmatched_spot_opened"
    };
  }
  if (type === "meetup.created" || type === "mission.created") {
    return {
      includeInContext: subjectIsMatched,
      initiativeEligible: false,
      priority: "context",
      reason: subjectIsMatched ? "new_matched_opportunity" : "generic_creation_event"
    };
  }
  if (type === "meetup.completed" || type === "meetup.joined" || type === "meetup.left" || type === "meetup.withdrawn" || type === "mission.joined") {
    return {
      includeInContext: subjectIsCurrent || type.startsWith("mission."),
      initiativeEligible: false,
      priority: "context",
      reason: "recent_coordination_history"
    };
  }
  if (type === "crew.invited") {
    return { includeInContext: true, initiativeEligible: false, priority: "high", reason: "crew_invitation_received" };
  }
  if (type === "crew.activated" || type === "crew.archived") {
    return { includeInContext: true, initiativeEligible: false, priority: "medium", reason: `crew_${type.split(".")[1]}` };
  }
  if (type === "crew.created" || type === "crew.joined" || type === "crew.declined" || type === "crew.left") {
    return { includeInContext: true, initiativeEligible: false, priority: "context", reason: "recent_crew_coordination" };
  }

  return { includeInContext: false, initiativeEligible: false, priority: "context", reason: "not_meaningful_enough" };
}

async function callRpc(config, accessToken, name, args) {
  const response = await fetch(`${config.url}/rest/v1/rpc/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(args || {}),
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(clean(data?.message || data?.error || `Circle RPC ${name} failed.`, 500));
    error.status = response.status;
    error.code = clean(data?.code, 120);
    error.details = clean(data?.details, 500);
    throw error;
  }
  return data;
}

async function callOptionalActionNetworkRpc(config, accessToken, name, args) {
  try {
    return await callRpc(config, accessToken, name, args);
  } catch (error) {
    if (isMissingActionNetworkRpc(error)) return [];
    throw error;
  }
}

function compactOpportunity(row = {}) {
  const key = clean(row?.opportunity_key, 160);
  if (!key) return null;
  const type = clean(row?.opportunity_type, 40);
  const metadata = object(row?.metadata);
  const mission = type === "mission"
    ? {
        objectiveType: clean(metadata?.objective_type, 40) || "completion",
        progressMode: clean(metadata?.progress_mode, 40) || "individual",
        targetValue: number(metadata?.target_value),
        unit: clean(metadata?.unit, 40) || null,
        verifiedProgress: number(metadata?.verified_progress),
        viewerVerifiedProgress: number(metadata?.viewer_verified_progress),
        viewerPendingProgress: number(metadata?.viewer_pending_progress),
        progressPercent: number(metadata?.progress_percent),
        objectiveReachedAt: metadata?.objective_reached_at || null
      }
    : null;

  return {
    key,
    type,
    id: clean(row?.opportunity_id, 120),
    title: clean(row?.title, 120),
    activity: clean(row?.activity, 80),
    area: clean(row?.area, 120) || null,
    startsAt: row?.starts_at || null,
    endsAt: row?.ends_at || null,
    organizer: {
      id: clean(row?.organizer_user_id, 120) || null,
      displayName: clean(row?.organizer_display_name, 100) || null,
      handle: clean(row?.organizer_handle, 80) || null
    },
    participantCount: number(row?.participant_count),
    capacity: number(row?.capacity),
    spotsRemaining: number(row?.spots_remaining),
    viewerState: clean(row?.viewer_state, 40) || "available",
    verificationMode: clean(row?.verification_mode, 60) || null,
    joinMode: clean(row?.join_mode, 40) || null,
    rewardXp: number(row?.reward_xp),
    pendingRequestCount: number(metadata?.pending_request_count),
    mission
  };
}

function compactIntent(row = {}) {
  const intentId = clean(row?.intent_id, 120);
  if (!intentId) return null;
  return {
    intentId,
    activity: clean(row?.activity, 80),
    experienceLevel: clean(row?.experience_level, 40),
    intensity: clean(row?.intensity, 40),
    desiredGroupMin: number(row?.desired_group_min),
    desiredGroupMax: number(row?.desired_group_max),
    area: clean(row?.area, 120) || null,
    radiusMiles: number(row?.radius_miles),
    timeWindowStart: row?.time_window_start || null,
    timeWindowEnd: row?.time_window_end || null,
    expiresAt: row?.expires_at || null
  };
}

function compactMatch(row = {}, intentId = null) {
  const opportunity = compactOpportunity(row);
  if (!opportunity) return null;
  return {
    ...opportunity,
    intentId,
    matchScore: number(row?.match_score),
    matchReasons: array(row?.match_reasons).map((item) => clean(item, 140)).filter(Boolean).slice(0, 6)
  };
}

function compactRelationship(row = {}) {
  const userId = clean(row?.other_user_id, 120);
  if (!userId) return null;
  return {
    userId,
    displayName: clean(row?.display_name, 100) || null,
    handle: clean(row?.handle, 80) || null,
    avatarUrl: clean(row?.avatar_url, 1000) || null,
    completedTogether: number(row?.completed_together) || 0,
    repeatCount: number(row?.repeat_count) || 0,
    firstCompletedAt: row?.first_completed_at || null,
    lastCompletedAt: row?.last_completed_at || null,
    hostedByMe: number(row?.hosted_by_me) || 0,
    hostedByThem: number(row?.hosted_by_them) || 0,
    uniqueActivities: number(row?.unique_activities) || 0,
    topActivity: clean(row?.top_activity, 80) || null,
    sharedActivityCounts: object(row?.shared_activity_counts)
  };
}

function compactPlace(row = {}, intentId = null) {
  const placeId = clean(row?.place_id, 120);
  if (!placeId) return null;
  return {
    placeId,
    intentId,
    name: clean(row?.place_name, 120),
    type: clean(row?.place_type, 60),
    area: clean(row?.area, 120),
    city: clean(row?.city, 100) || null,
    region: clean(row?.region, 100) || null,
    activityTags: array(row?.activity_tags).map((item) => clean(item, 60)).filter(Boolean).slice(0, 12),
    verificationState: clean(row?.verification_state, 40),
    distanceMiles: number(row?.distance_miles)
  };
}

function compactCrew(row = {}) {
  const crewId = clean(row?.crew_id, 120);
  if (!crewId) return null;
  const members = array(row?.members).map(compactCrewMember).filter(Boolean).slice(0, MAX_CREW_MEMBERS);
  return {
    crewId,
    name: clean(row?.name, 60),
    status: clean(row?.crew_status, 30),
    viewerRole: clean(row?.viewer_role, 30),
    viewerStatus: clean(row?.viewer_status, 30),
    activeMemberCount: Math.max(0, number(row?.active_member_count) || 0),
    invitedMemberCount: Math.max(0, number(row?.invited_member_count) || 0),
    completedActivityCount: Math.max(0, number(row?.completed_activity_count) || 0),
    lastActivityAt: row?.last_activity_at || null,
    createdAt: row?.created_at || null,
    members
  };
}

function compactCrewCandidate(row = {}) {
  const candidateKey = clean(row?.candidate_key, 64);
  const completedTogether = number(row?.completed_together) || 0;
  if (!candidateKey || completedTogether < 2) return null;
  const members = array(row?.members).map(compactCrewMember).filter(Boolean).slice(0, MAX_CREW_MEMBERS);
  return {
    candidateKey,
    memberCount: Math.max(0, number(row?.member_count) || members.length),
    completedTogether,
    firstCompletedAt: row?.first_completed_at || null,
    lastCompletedAt: row?.last_completed_at || null,
    topActivity: clean(row?.top_activity, 80) || null,
    members
  };
}

function compactCrewMember(row = {}) {
  const displayName = clean(row?.display_name, 100) || null;
  const handle = clean(row?.handle, 80) || null;
  if (!displayName && !handle && row?.is_viewer !== true) return null;
  return {
    displayName,
    handle,
    avatarUrl: clean(row?.avatar_url, 1000) || null,
    role: clean(row?.role, 30) || null,
    status: clean(row?.status, 30) || null,
    isViewer: row?.is_viewer === true
  };
}

function compactDomainEvent(row = {}, viewerId = null) {
  const eventId = clean(row?.event_id, 120);
  const type = clean(row?.event_type, 80);
  const subjectType = clean(row?.subject_type, 40);
  const subjectId = clean(row?.subject_id, 120);
  if (!eventId || !type || !subjectType || !subjectId) return null;

  const metadata = safeEventMetadata(row?.metadata);
  const actorUserId = clean(row?.actor_user_id, 120) || null;
  return {
    eventId,
    type,
    subjectType,
    subjectId,
    actor: actorUserId
      ? {
          displayName: clean(row?.actor_display_name, 100) || null,
          handle: clean(row?.actor_handle, 80) || null
        }
      : null,
    actorIsViewer: Boolean(viewerId && actorUserId && viewerId === actorUserId),
    metadata,
    occurredAt: row?.occurred_at || null
  };
}

function safeEventMetadata(value) {
  const source = object(value);
  const output = {};
  const requestStatus = clean(source?.request_status, 40);
  const spotsRemaining = number(source?.spots_remaining);
  const contributionAmount = number(source?.contribution_amount);
  const unit = clean(source?.unit, 40);
  const crewStatus = clean(source?.crew_status, 30);
  const memberStatus = clean(source?.member_status, 30);

  if (requestStatus) output.requestStatus = requestStatus;
  if (spotsRemaining !== null) output.spotsRemaining = Math.max(0, spotsRemaining);
  if (contributionAmount !== null) output.contributionAmount = contributionAmount;
  if (unit) output.unit = unit;
  if (crewStatus) output.crewStatus = crewStatus;
  if (memberStatus) output.memberStatus = memberStatus;
  return output;
}

function dedupeMatches(rows = []) {
  const byKey = new Map();
  for (const row of rows) {
    if (!row?.key) continue;
    const current = byKey.get(row.key);
    if (!current || (number(row.matchScore) || 0) > (number(current.matchScore) || 0)) {
      byKey.set(row.key, row);
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const scoreDelta = (number(b.matchScore) || 0) - (number(a.matchScore) || 0);
    if (scoreDelta) return scoreDelta;
    return Date.parse(a?.startsAt || "") - Date.parse(b?.startsAt || "");
  });
}

function dedupePlaces(rows = []) {
  const byId = new Map();
  for (const row of rows) {
    if (!row?.placeId) continue;
    const current = byId.get(row.placeId);
    const nextDistance = number(row?.distanceMiles);
    const currentDistance = number(current?.distanceMiles);
    if (!current || (nextDistance !== null && (currentDistance === null || nextDistance < currentDistance))) {
      byId.set(row.placeId, row);
    }
  }
  return [...byId.values()].sort((a, b) => {
    const aDistance = number(a?.distanceMiles);
    const bDistance = number(b?.distanceMiles);
    if (aDistance !== null && bDistance !== null && aDistance !== bDistance) return aDistance - bDistance;
    if (aDistance !== null && bDistance === null) return -1;
    if (aDistance === null && bDistance !== null) return 1;
    return clean(a?.name, 120).localeCompare(clean(b?.name, 120));
  });
}

function eventSort(a, b) {
  const weightDelta = eventPriorityWeight(b?.priority) - eventPriorityWeight(a?.priority);
  if (weightDelta) return weightDelta;
  const aTime = Date.parse(a?.occurredAt || "") || 0;
  const bTime = Date.parse(b?.occurredAt || "") || 0;
  return bTime - aTime || clean(a?.eventId, 120).localeCompare(clean(b?.eventId, 120));
}

function eventPriorityWeight(value) {
  if (value === "high") return 4;
  if (value === "medium") return 3;
  if (value === "positive") return 2;
  return 1;
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  // Deliberately no service-role fallback. Circle RPCs must execute as the user.
  const key = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function bearerToken(value = "") {
  const match = /^Bearer\s+(.+)$/i.exec(clean(value, 7000));
  return clean(match?.[1], 7000) || null;
}

function jwtSubject(token = "") {
  try {
    const payload = clean(token, 7000).split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return clean(decoded?.sub, 120) || null;
  } catch {
    return null;
  }
}

function isMissingActionNetworkRpc(error) {
  const text = `${clean(error?.message, 500)} ${clean(error?.details, 500)} ${clean(error?.code, 120)}`;
  return error?.status === 404 || /PGRST202|could not find the function|schema cache/i.test(text);
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function normalizeStatus(value) {
  const status = Number(value);
  return Number.isFinite(status) && status >= 400 && status <= 599 ? Math.floor(status) : 500;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}
function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function number(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
