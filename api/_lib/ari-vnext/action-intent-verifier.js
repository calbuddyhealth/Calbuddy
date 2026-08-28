// ARI vNext — semantic verification for explicit app mutations.
// This bounded GPT-4o-mini pass independently verifies whether the CURRENT
// message authorizes a write. It never executes an action itself.

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";

export async function reviewExplicitApplicationIntent({ turn = {}, route = {}, tools = [] } = {}) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  const availableTools = (Array.isArray(tools) ? tools : [])
    .filter((tool) => tool?.type === "function" && typeof tool?.name === "string")
    .map((tool) => String(tool.name).trim())
    .filter(Boolean);

  if (!availableTools.length) return null;

  const dailyGoalKnown = resolveDailyGoalKnown(turn);
  const decisions = [
    "none",
    "blocked_future_meal_plan",
    "blocked_missing_daily_goal",
    ...availableTools
  ];

  const verifierTool = {
    type: "function",
    name: "verify_action_intent",
    description: "Classify whether the CURRENT user message explicitly requests one available ARI XP app mutation.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        decision: { type: "string", enum: decisions },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reason: { type: "string" }
      },
      required: ["decision", "confidence", "reason"]
    }
  };

  const instructions = [
    "You are Ari vNext's semantic action verifier.",
    "Ari's primary reasoning pass has already run. Independently verify whether the CURRENT user message explicitly authorizes an ARI XP mutation.",
    "Do not infer permission to mutate from conversation history, app state, or a statement of fact.",
    "A statement such as 'I ate eggs' is NOT permission to log food. 'I ate the breakfast you planned for me' is also NOT permission to log the planned meal. A question such as 'is chicken healthy?' is NOT a mutation request.",
    "If the user explicitly asks Ari to log, save, record, create, build, plan, edit, change, replace, remove, update, start, complete, cancel, host, publish, join, RSVP, request a spot, leave, withdraw, back out, submit, add progress, contribute progress, accept, decline, archive, close, or end something and a matching tool is available, select that tool.",
    "For ARI Circle Meetups, distinguish cancelling the user's OWN participation from cancelling an entire HOSTED meetup. 'I can't make it, take me out' means leave/withdraw. 'Cancel the meetup I'm hosting' means cancel the hosted meetup. Never escalate one into the other.",
    "For ARI Circle Missions, distinguish read-only discovery from a write. 'What Missions are active?', 'show me Missions at Mission Bay', or 'how close are we?' are read-only and must use decision=none. 'Create a 100-mile community Mission', 'join that Mission', and 'add my 3 miles to that Mission' are explicit writes when the matching tool is available.",
    "Never treat a request to review, approve, verify, reject, or judge ANOTHER person's Mission contribution as permission for create/join/progress tools. No Mission-review mutation tool is available in this phase.",
    "For ARI Circle Crews, discovery or explanation is read-only. 'Why is this a Crew candidate?', 'who have I trained with?', or 'show my Crews' must use decision=none. 'Make this group a Crew' can select propose_create_circle_crew only when that tool is available; the trusted server must resolve the opaque evidence-backed candidate. Never infer or invent founding members.",
    "For Crew invitations, 'accept that Crew invite' maps only to the accept-invite tool and 'decline/pass on that Crew invite' maps only to the decline-invite tool. Do not treat accepting a Crew invite as permission to add other people.",
    "For Crew departures, distinguish leaving the user's OWN membership from archiving an entire OWNED Crew. 'I want out of this Crew' means leave. 'Archive/close/end the Crew I own' means archive. Never escalate a leave request into archive.",
    "No Crew tool may add arbitrary members, choose a replacement member, make a Crew public, award XP, or alter another member's invitation response.",
    "For ARI Circle, a discovery question such as 'anything going on tonight?' or 'what should I do?' is read-only and must use decision=none. Only choose a Circle mutation tool when the current message explicitly asks to change Circle state.",
    "Interpret natural language semantically. The user does not need to use the exact tool or feature name. For example, 'figure out what I should eat for the rest of today using my calories left and set it up for me' can be a request to create today's Meal Plan.",
    "ARI XP Meal Plan is strictly TODAY ONLY. If the user asks Ari to create or schedule a Meal Plan for tomorrow or another future day, select blocked_future_meal_plan instead of any tool.",
    "If the user asks Ari to create today's Meal Plan based on their saved Daily Calorie Goal or remaining calorie budget, but that saved goal is unknown and the user did not provide an explicit numeric calorie target in the CURRENT message, select blocked_missing_daily_goal.",
    "Do not select blocked_missing_daily_goal for a general meal idea that is not budget-based, or when the user gives a clear explicit calorie target such as 500 calories.",
    "Do not select blocked_future_meal_plan for a general future nutrition question that is not asking to create/schedule the ARI XP Meal Plan.",
    `Saved Daily Calorie Goal known: ${dailyGoalKnown ? "true" : "false"}.`,
    `Available app tools: ${availableTools.join(", ")}.`,
    `Current route: ${JSON.stringify({ nutrition: Boolean(route?.nutrition), training: Boolean(route?.training), goals: Boolean(route?.goals), social: Boolean(route?.social), circleAllowed: Boolean(route?.circleAllowed), teenMode: Boolean(route?.teenMode) })}.`,
    "Use decision=none when the message is advice, explanation, casual conversation, a factual statement, a discovery/read request, or otherwise does not explicitly authorize a write."
  ].join("\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const body = {
    model: process.env.ARI_VNEXT_FAST_MODEL || "gpt-4o-mini",
    instructions,
    input: [{ role: "user", content: String(turn?.message || "").trim() }],
    tools: [verifierTool],
    tool_choice: { type: "function", name: "verify_action_intent" },
    parallel_tool_calls: false,
    max_output_tokens: 180,
    store: false
  };

  if (turn?.userId) {
    const userId = String(turn.userId);
    body.safety_identifier = userId.slice(0, 200);
    body.prompt_cache_key = `ari-action:${userId.slice(0, 53)}`.slice(0, 64);
  }

  try {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;

    const call = Array.isArray(data?.output)
      ? data.output.find((item) => item?.type === "function_call" && item?.name === "verify_action_intent")
      : null;
    if (!call) return null;

    let args = {};
    try {
      args = JSON.parse(String(call?.arguments || "{}"));
    } catch {
      return null;
    }

    let decision = String(args?.decision || "none").trim();
    const confidence = Number.isFinite(Number(args?.confidence))
      ? Math.max(0, Math.min(1, Number(args.confidence)))
      : 0;

    if (!decisions.includes(decision)) return null;

    if (
      decision === "blocked_missing_daily_goal" &&
      dailyGoalKnown &&
      availableTools.includes("propose_today_meal_plan")
    ) {
      decision = "propose_today_meal_plan";
    }

    return {
      version: "1.5.0",
      decision,
      confidence,
      reason: String(args?.reason || "").trim().slice(0, 500),
      dailyGoalKnown,
      model: data?.model || body.model,
      providerRequestId: data?.id || null,
      usage: data?.usage || null
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function resolveDailyGoalKnown(turn = {}) {
  const policy = turn?.context?.nutrition?.calorieBudgetPolicy;
  if (typeof policy?.dailyGoalKnown === "boolean") return policy.dailyGoalKnown;

  const candidates = [
    policy?.dailyGoal,
    turn?.context?.goals?.dailyGoal,
    turn?.context?.dailyGoal
  ];
  return candidates.some((value) => Number.isFinite(Number(value)) && Number(value) > 0);
}
