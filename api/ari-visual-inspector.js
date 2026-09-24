import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID
} from "node:crypto";
import {
  extractBearerToken,
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";
import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

const WORKFLOW_FILE = "ari-visual-inspector.yml";
const MAX_INSTRUCTION = 1200;
const MAX_ACTIONS = 8;
const MAX_LOG_CHARS = 5_000_000;
const LIVE_GRANT_TTL_MS = 3 * 60 * 1000;
const LIVE_MIN_ACCESS_TTL_MS = 8 * 60 * 1000;
const LIVE_AUTH_STORAGE_KEY = "calbuddy-auth-session";
const LIVE_GRANT_VERSION = "vlg1";

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      code: "METHOD_NOT_ALLOWED",
      error: "Method not allowed."
    });
  }

  const action = clean(req.body?.action, 40).toLowerCase() || "start";

  // The remote Playwright worker cannot carry the owner's normal browser
  // Authorization header. Live Owner mode instead receives a short-lived,
  // encrypted capability grant bound to one visual request and ARI XP origin.
  if (action === "exchange_live_grant") {
    try {
      return await exchangeLiveGrant({ req, res });
    } catch (error) {
      return res.status(Number(error?.status) || 401).json({
        success: false,
        code: error?.code || "LIVE_OWNER_GRANT_INVALID",
        error: error?.message || "The Live Owner browser grant is invalid."
      });
    }
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization.authorized) {
    return sendOwnerAuthorizationError(res, authorization);
  }

  const token = clean(process.env.APP_HEALTH_GITHUB_TOKEN || process.env.GITHUB_TOKEN, 8000);
  const repo = clean(process.env.GITHUB_REPO, 300);
  // The Visual Inspector workflow is a control-plane worker. It must run from
  // the canonical default branch regardless of whatever branch App Health or
  // repository editing happens to target. Coupling this to APP_HEALTH_BRANCH
  // or GITHUB_BRANCH can dispatch against a stale workflow schema.
  const branch = "main";

  if (!token || !repo) {
    return res.status(503).json({
      success: false,
      code: "VISUAL_INSPECTOR_NOT_CONFIGURED",
      error: "ARI visual inspection requires the existing GitHub developer connection."
    });
  }

  try {
    if (action === "start") {
      return await startInspection({
        req,
        res,
        token,
        repo,
        branch,
        authorization
      });
    }

    if (action === "status") {
      return await inspectionStatus({
        req,
        res,
        token,
        repo,
        branch,
        authorization
      });
    }

    return res.status(400).json({
      success: false,
      code: "UNSUPPORTED_VISUAL_ACTION",
      error: "Unsupported visual inspector action."
    });
  } catch (error) {
    console.error("[ARI Visual Inspector Error]", error);
    return res.status(Number(error?.status) || 500).json({
      success: false,
      code: error?.code || "ARI_VISUAL_INSPECTOR_FAILED",
      error: error?.message || "ARI visual inspection failed."
    });
  }
}

async function exchangeLiveGrant({ req, res }) {
  const grant = clean(req.body?.grant, 20_000);
  const requestId = clean(req.body?.requestId, 120);

  if (!grant || !requestId) {
    throw liveGrantError(
      400,
      "LIVE_OWNER_GRANT_REQUIRED",
      "A Live Owner browser grant and request ID are required."
    );
  }

  const payload = decryptLiveOwnerGrant(grant);
  const now = Date.now();

  if (payload?.requestId !== requestId) {
    throw liveGrantError(
      403,
      "LIVE_OWNER_GRANT_REQUEST_MISMATCH",
      "The Live Owner grant does not belong to this visual inspection."
    );
  }

  if (!Number.isFinite(Number(payload?.grantExpiresAt)) || Number(payload.grantExpiresAt) <= now) {
    throw liveGrantError(
      401,
      "LIVE_OWNER_GRANT_EXPIRED",
      "The Live Owner browser grant expired before it was exchanged."
    );
  }

  if (!Number.isFinite(Number(payload?.accessTokenExpiresAt)) || Number(payload.accessTokenExpiresAt) <= now + 60_000) {
    throw liveGrantError(
      401,
      "LIVE_OWNER_ACCESS_EXPIRED",
      "The delegated owner access token is no longer usable."
    );
  }

  const grantedBaseUrl = normalizeBaseUrl(payload?.baseUrl);
  const grantedHost = new URL(grantedBaseUrl).host.toLowerCase();
  const requestHost = clean(
    req.headers?.["x-forwarded-host"] ||
    req.headers?.host,
    500
  ).split(",")[0].trim().toLowerCase();

  if (!requestHost || requestHost !== grantedHost) {
    throw liveGrantError(
      403,
      "LIVE_OWNER_GRANT_ORIGIN_MISMATCH",
      "The Live Owner grant can only be exchanged by its assigned ARI XP origin."
    );
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  return res.status(200).json({
    success: true,
    requestId,
    accessToken: payload.accessToken,
    expiresAt: new Date(Number(payload.accessTokenExpiresAt)).toISOString(),
    storageKey: LIVE_AUTH_STORAGE_KEY,
    user: {
      id: clean(payload?.user?.id, 120),
      email: clean(payload?.user?.email, 320)
    },
    readOnly: true,
    mutationAuthority: false,
    aiProcessingAuthorization: {
      authorized:
        payload?.aiProcessingAuthorization?.authorized === true,
      scope: clean(
        payload?.aiProcessingAuthorization?.scope,
        120
      ),
      requestId: clean(
        payload?.aiProcessingAuthorization?.requestId,
        120
      ),
      expiresAt: Number(
        payload?.aiProcessingAuthorization?.expiresAt || 0
      )
    }
  });
}

async function startInspection({
  req,
  res,
  token,
  repo,
  branch,
  authorization
}) {
  const requestId = `vis_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const baseUrl = normalizeBaseUrl(
    req.body?.baseUrl ||
    process.env.ARI_VISUAL_BASE_URL ||
    "https://www.calbuddyhealth.com"
  );
  const targetPath = normalizePath(req.body?.targetPath || "/home.html");
  const viewports = normalizeViewports(req.body?.viewports);
  const instruction = clean(req.body?.instruction, MAX_INSTRUCTION);
  const actions = normalizeActions(req.body?.actions);
  const actionsB64 = Buffer.from(JSON.stringify(actions), "utf8").toString("base64");
  const visualMode = normalizeVisualMode(req.body?.visualMode);
  const liveGrant =
    visualMode === "live_owner"
      ? createLiveOwnerGrant({
          req,
          authorization,
          requestId,
          baseUrl,
          liveOwnerExpiresAt: Number(req.body?.liveOwnerExpiresAt || 0)
        })
      : "";

  const response = await githubFetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        ref: branch,
        inputs: {
          request_id: requestId,
          base_url: baseUrl,
          target_path: targetPath,
          viewports,
          auth_mode: visualMode === "live_owner" ? "live_owner" : "mock_owner",
          instruction,
          actions_b64: actionsB64,
          live_grant: liveGrant
        }
      })
    }
  );

  if (!response.ok) {
    const body = await safeJson(response);
    console.error("[ARI Visual Inspector Dispatch Failed]", {
      status: response.status,
      message: body?.message || null,
      errors: Array.isArray(body?.errors)
        ? body.errors.slice(0, 8).map(item => ({
            resource: clean(item?.resource, 120),
            field: clean(item?.field, 120),
            code: clean(item?.code, 120),
            message: clean(item?.message, 500)
          }))
        : [],
      repo,
      branch,
      workflow: WORKFLOW_FILE,
      visualMode,
      inputKeys: [
        "request_id",
        "base_url",
        "target_path",
        "viewports",
        "auth_mode",
        "instruction",
        "actions_b64",
        "live_grant"
      ]
    });

    return res.status(response.status).json({
      success: false,
      status: "failed",
      code: "VISUAL_WORKFLOW_DISPATCH_FAILED",
      error: body?.message || "Could not start ARI visual inspection.",
      dispatch: {
        status: response.status,
        branch,
        workflow: WORKFLOW_FILE,
        errors: Array.isArray(body?.errors)
          ? body.errors.slice(0, 8).map(item => ({
              resource: clean(item?.resource, 120),
              field: clean(item?.field, 120),
              code: clean(item?.code, 120),
              message: clean(item?.message, 500)
            }))
          : []
      }
    });
  }

  return res.status(202).json({
    success: true,
    status: "queued",
    requestId,
    targetPath,
    baseUrl,
    viewports,
    visualMode,
    readOnlySandbox: visualMode !== "live_owner",
    liveOwner: visualMode === "live_owner",
    authorizationMode: authorization.mode,
    message:
      visualMode === "live_owner"
        ? `ARI Live Owner inspection started for ${targetPath} using the owner's current authenticated app state with server mutations blocked.`
        : `ARI visual inspection started for ${targetPath} in the read-only sandbox.`
  });
}

async function inspectionStatus({
  req,
  res,
  token,
  repo,
  branch,
  authorization
}) {
  const requestId = clean(req.body?.requestId, 120);
  const instruction = clean(req.body?.instruction, MAX_INSTRUCTION);

  if (!/^vis_[a-z0-9]{12,40}$/i.test(requestId)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_VISUAL_REQUEST_ID",
      error: "A valid visual inspection request ID is required."
    });
  }

  const runsResponse = await githubFetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/runs?event=workflow_dispatch&branch=${encodeURIComponent(branch)}&per_page=40`,
    token
  );

  const runsBody = await safeJson(runsResponse);
  if (!runsResponse.ok) {
    return res.status(runsResponse.status).json({
      success: false,
      code: "VISUAL_RUN_LOOKUP_FAILED",
      error: runsBody?.message || "Could not read ARI visual inspection status."
    });
  }

  const runs = Array.isArray(runsBody?.workflow_runs) ? runsBody.workflow_runs : [];
  const run = runs.find(item =>
    String(item?.display_title || "").includes(requestId)
  );

  if (!run) {
    return res.status(200).json({
      success: true,
      status: "queued",
      requestId,
      message: "ARI visual inspection is queued."
    });
  }

  if (run.status !== "completed") {
    return res.status(200).json({
      success: true,
      status: run.status || "in_progress",
      requestId,
      runId: run.id,
      message: "ARI is navigating and inspecting the app."
    });
  }

  if (run.conclusion !== "success") {
    return res.status(200).json({
      success: false,
      status: "failed",
      requestId,
      runId: run.id,
      conclusion: run.conclusion || "failure",
      code: "VISUAL_INSPECTION_WORKFLOW_FAILED",
      error: "The browser worker could not complete the visual inspection."
    });
  }

  const report = await readVisualReportFromRun({
    token,
    repo,
    runId: run.id
  });

  if (!report) {
    return res.status(502).json({
      success: false,
      status: "failed",
      requestId,
      runId: run.id,
      code: "VISUAL_RESULT_MISSING",
      error: "The browser worker finished but its visual evidence could not be recovered."
    });
  }

  const resolvedInstruction = instruction || report.instruction || "";
  const coverage = evaluateVisualCoverage({
    report,
    instruction: resolvedInstruction
  });

  if (coverage.wholeAppRequested && !coverage.complete) {
    return res.status(200).json({
      success: false,
      status: "failed",
      requestId,
      runId: run.id,
      authorizationMode: authorization.mode,
      readOnlySandbox: report?.authMode !== "live_owner",
      liveOwner: report?.authMode === "live_owner",
      visualMode: report?.authMode === "live_owner" ? "live_owner" : "sandbox",
      code: "VISUAL_TOUR_INCOMPLETE",
      coverage,
      evidence: compactReport(report),
      error:
        `The whole-app visual tour was incomplete: captured ${coverage.capturedRoutes} of ${coverage.expectedRoutes} expected route checkpoints. I won't describe that as a full-app inspection.`
    });
  }

  const visualAnalysis = await analyzeVisualEvidence({
    report,
    instruction: resolvedInstruction,
    userId: authorization.user?.id || null
  });

  return res.status(200).json({
    success: true,
    status: "completed",
    requestId,
    runId: run.id,
    authorizationMode: authorization.mode,
    readOnlySandbox: report?.authMode !== "live_owner",
    liveOwner: report?.authMode === "live_owner",
    visualMode: report?.authMode === "live_owner" ? "live_owner" : "sandbox",
    coverage,
    visualAnalysis,
    evidence: compactReport(report),
    message: visualAnalysis?.summary || "ARI completed the visual inspection."
  });
}

async function readVisualReportFromRun({ token, repo, runId }) {
  const jobsResponse = await githubFetch(
    `https://api.github.com/repos/${repo}/actions/runs/${encodeURIComponent(runId)}/jobs?per_page=20`,
    token
  );
  const jobsBody = await safeJson(jobsResponse);
  if (!jobsResponse.ok) return null;

  const jobs = Array.isArray(jobsBody?.jobs) ? jobsBody.jobs : [];
  const job = jobs.find(item => item?.name === "inspect") || jobs[0];
  if (!job?.id) return null;

  const logsResponse = await githubFetch(
    `https://api.github.com/repos/${repo}/actions/jobs/${job.id}/logs`,
    token,
    { headers: { Accept: "application/vnd.github+json" } }
  );
  if (!logsResponse.ok) return null;

  const logs = (await logsResponse.text()).slice(-MAX_LOG_CHARS);
  const marker = "ARI_VISUAL_RESULT_CHUNK:";
  const chunks = [];

  for (const line of logs.split(/\r?\n/)) {
    const markerIndex = line.indexOf(marker);
    if (markerIndex < 0) continue;

    const payload = line.slice(markerIndex + marker.length).trim();
    const match = payload.match(/^(\d+)\/(\d+):([A-Za-z0-9+/=]+)$/);
    if (!match) continue;

    chunks.push({
      index: Number(match[1]),
      total: Number(match[2]),
      data: match[3]
    });
  }

  if (!chunks.length) return null;
  const total = chunks[0].total;
  const unique = new Map(chunks.map(chunk => [chunk.index, chunk]));
  if (!Number.isInteger(total) || total < 1 || unique.size !== total) return null;

  const encoded = Array.from({ length: total }, (_, index) =>
    unique.get(index + 1)?.data || ""
  ).join("");

  try {
    const json = Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function analyzeVisualEvidence({ report, instruction, userId }) {
  if (
    report?.authMode === "live_owner" &&
    !hasScopedLiveOwnerAIProcessingAuthorization(report)
  ) {
    return {
      summary:
        "The Live Owner browser captured the app, but its scoped AI-processing authorization was missing or expired, so the screenshots were not sent for AI vision analysis.",
      findings: structuralFindings(report),
      likelyCause: null,
      recommendedNextStep:
        "Start a new Live Owner inspection so a fresh visual_owner_inspection authorization can be issued.",
      searchHints: [],
      confidence: "high",
      visionUsed: false,
      visionBlockedByConsent: true
    };
  }

  const apiKey = clean(process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) {
    return {
      summary: "The browser inspection completed, but ARI's vision model is not configured.",
      findings: structuralFindings(report),
      likelyCause: null,
      recommendedNextStep: "Use the captured DOM/layout evidence to continue developer investigation.",
      confidence: "medium",
      visionUsed: false
    };
  }

  const captures = Array.isArray(report?.captures) ? report.captures.slice(0, 8) : [];
  const images = captures
    .map(item => clean(item?.screenshotDataUrl, 2_000_000))
    .filter(value => value.startsWith("data:image/"))
    .map(imageUrl => ({
      type: "image_url",
      image_url: {
        url: imageUrl,
        detail: "high"
      }
    }));

  const evidenceText = JSON.stringify(
    {
      request: clean(instruction, MAX_INSTRUCTION),
      targetPath: report?.targetPath || null,
      actionsApplied: report?.actionsApplied || [],
      captures: captures.map(item => ({
        checkpoint: item.checkpoint || null,
        viewport: item.viewport,
        url: item.url,
        title: item.title,
        bodyText: clean(item.bodyText, 1500),
        metrics: item.metrics,
        interactive: Array.isArray(item.interactive) ? item.interactive.slice(0, 20) : [],
        navigation: Array.isArray(item.navigation) ? item.navigation.slice(0, 16) : [],
        consoleErrors: item.consoleErrors || [],
        failedRequests: item.failedRequests || []
      }))
    },
    null,
    2
  ).slice(0, 18000);

  const systemPrompt = `
You are ARI XP's Visual App Inspector.
You are looking at screenshots captured by ${
    report?.authMode === "live_owner"
      ? "a temporary Live Owner Playwright session using the owner's real authenticated ARI XP state; browser-side server mutations are blocked"
      : "a read-only Playwright owner sandbox using simulated data"
  }, plus exact DOM/layout evidence.

Your job is to visually inspect the UI, not merely summarize markup.
Prioritize:
- clipping, horizontal overflow, zoom/viewport problems
- overlapping or cut-off content
- awkward spacing, hierarchy, density, alignment, and responsiveness
- controls that are hidden, duplicated, visually confusing, or difficult to reach
- differences between mobile and desktop when both are provided
- differences across routes when a bounded whole-app tour is provided; name the route for each route-specific finding
- console/network evidence when it materially explains the visual problem

Do not claim you edited code.
Do not infer private user data from the sandbox.
When evidence identifies likely selectors/classes/IDs, include them as searchHints for repository investigation.
Return only JSON:
{
  "summary": "direct visual conclusion",
  "findings": ["specific finding"],
  "likelyCause": "visual/DOM cause or null",
  "recommendedNextStep": "specific next developer action",
  "searchHints": ["selector, id, visible label, or route"],
  "confidence": "low|medium|high",
  "visionUsed": true
}
`.trim();

  const model = clean(process.env.OPENAI_VISION_MODEL || "gpt-4o-mini", 160);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Owner request: ${instruction || "Inspect this ARI XP screen."}\n\nExact browser evidence:\n${evidenceText}`
            },
            ...images
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 900,
      response_format: { type: "json_object" }
    })
  });

  const data = await safeJson(response);
  if (!response.ok) {
    return {
      summary: "The browser inspection completed, but visual interpretation failed.",
      findings: structuralFindings(report),
      likelyCause: null,
      recommendedNextStep: "Continue with the exact DOM/layout evidence from the browser worker.",
      confidence: "medium",
      visionUsed: false,
      visionError: data?.error?.message || "Vision request failed."
    };
  }

  await recordOpenAIUsage({
    userId,
    endpoint: "/api/ari-visual-inspector",
    usageType: "image",
    requestCategory: "owner_visual_app_inspection",
    model: data?.model || model,
    responseData: data,
    providerRequestId: response.headers.get("x-request-id") || data?.id || null,
    metadata: {
      targetPath: report?.targetPath || null,
      captureCount: captures.length,
      viewportMode: (() => {
        const ids = [...new Set(captures.map(item => item?.viewport?.id).filter(Boolean))];
        return ids.length > 1 ? "both" : ids[0] || "unknown";
      })(),
      routeCaptureCount: captures.length,
      readOnlySandbox: report?.authMode !== "live_owner"
    }
  }).catch(() => null);

  try {
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    return {
      summary: clean(parsed?.summary, 1600) || "ARI visually inspected the app.",
      findings: normalizeStringArray(parsed?.findings, 12, 800),
      likelyCause: clean(parsed?.likelyCause, 1600) || null,
      recommendedNextStep: clean(parsed?.recommendedNextStep, 1600) || null,
      searchHints: normalizeStringArray(parsed?.searchHints, 16, 260),
      confidence: ["low", "medium", "high"].includes(parsed?.confidence)
        ? parsed.confidence
        : "medium",
      visionUsed: true
    };
  } catch {
    return {
      summary: clean(data?.choices?.[0]?.message?.content, 1600) || "ARI visually inspected the app.",
      findings: structuralFindings(report),
      likelyCause: null,
      recommendedNextStep: "Use the captured visual evidence to continue developer investigation.",
      searchHints: [],
      confidence: "medium",
      visionUsed: true
    };
  }
}

function hasScopedLiveOwnerAIProcessingAuthorization(report) {
  const authorization = report?.aiProcessingAuthorization || {};
  return (
    authorization?.authorized === true &&
    authorization?.scope === "visual_owner_inspection" &&
    clean(authorization?.requestId, 120) === clean(report?.requestId, 120) &&
    Number.isFinite(Number(authorization?.expiresAt)) &&
    Number(authorization.expiresAt) > Date.now()
  );
}

function compactReport(report) {
  return {
    version: report?.version || null,
    requestId: report?.requestId || null,
    generatedAt: report?.generatedAt || null,
    baseUrl: report?.baseUrl || null,
    targetPath: report?.targetPath || null,
    authMode: report?.authMode || null,
    aiProcessingAuthorization: {
      authorized:
        report?.aiProcessingAuthorization?.authorized === true,
      scope: clean(
        report?.aiProcessingAuthorization?.scope,
        120
      ) || null,
      requestId: clean(
        report?.aiProcessingAuthorization?.requestId,
        120
      ) || null,
      expiresAt: Number(
        report?.aiProcessingAuthorization?.expiresAt || 0
      ) || null
    },
    actionsApplied: report?.actionsApplied || [],
    captures: (Array.isArray(report?.captures) ? report.captures : []).map(item => ({
      checkpoint: item.checkpoint || null,
      viewport: item.viewport,
      url: item.url,
      title: item.title,
      metrics: item.metrics,
      interactive: Array.isArray(item.interactive) ? item.interactive.slice(0, 20) : [],
      navigation: Array.isArray(item.navigation) ? item.navigation.slice(0, 16) : [],
      consoleErrors: item.consoleErrors || [],
      failedRequests: item.failedRequests || [],
      blockedMutations: item.blockedMutations || [],
      screenshotAvailable: Boolean(item.screenshotDataUrl)
    }))
  };
}

function evaluateVisualCoverage({ report, instruction = "" } = {}) {
  const wholeAppRequested =
    /\b(entire app|whole app|full app|all (?:the )?(?:app )?pages|navigate (?:the )?(?:entire |whole |full )?app|look through (?:the )?(?:entire |whole |full )?app|tour (?:the )?app)\b/i.test(
      String(instruction || "")
    );

  const captures = Array.isArray(report?.captures) ? report.captures : [];
  const actions = Array.isArray(report?.actionsApplied) ? report.actionsApplied : [];
  const visitActions = actions.filter(action => action?.type === "visit_path");
  const visitedCheckpoints = captures.filter(capture =>
    String(capture?.checkpoint || "").startsWith("visit:")
  );

  const expectedVisitedRoutes = wholeAppRequested ? 7 : visitActions.length;
  const expectedRoutes = wholeAppRequested ? 8 : Math.max(1, expectedVisitedRoutes + 1);
  const capturedRoutes = captures.length;

  const expectedPaths = wholeAppRequested
    ? [
        "/goals.html",
        "/nutrition.html",
        "/ari-training.html",
        "/progress.html",
        "/ari-circle-feed.html",
        "/profile.html",
        "/owner-ai-controls.html"
      ]
    : visitActions.map(action => String(action?.path || "")).filter(Boolean);

  const capturedPaths = new Set(
    captures
      .map(capture => {
        try {
          return new URL(String(capture?.url || "")).pathname;
        } catch {
          return "";
        }
      })
      .filter(Boolean)
  );

  const missingPaths = expectedPaths.filter(path => !capturedPaths.has(path));
  const complete =
    !wholeAppRequested ||
    (
      visitActions.length >= expectedVisitedRoutes &&
      visitedCheckpoints.length >= expectedVisitedRoutes &&
      capturedRoutes >= expectedRoutes &&
      missingPaths.length === 0
    );

  return {
    wholeAppRequested,
    complete,
    expectedRoutes,
    capturedRoutes,
    expectedVisitedRoutes,
    appliedVisitActions: visitActions.length,
    capturedVisitCheckpoints: visitedCheckpoints.length,
    expectedPaths,
    missingPaths
  };
}

function structuralFindings(report) {
  const findings = [];
  for (const capture of Array.isArray(report?.captures) ? report.captures : []) {
    const id = [
      capture?.checkpoint || capture?.url || "route",
      capture?.viewport?.id || "viewport"
    ].join(" · ");
    const metrics = capture?.metrics || {};
    if (metrics.horizontalOverflow) {
      findings.push(
        `${id}: horizontal overflow of about ${Number(metrics.overflowPixels || 0)} px.`
      );
    }
    if (Array.isArray(capture?.consoleErrors) && capture.consoleErrors.length) {
      findings.push(`${id}: ${capture.consoleErrors.length} browser console error(s).`);
    }
    if (Array.isArray(capture?.failedRequests) && capture.failedRequests.length) {
      findings.push(`${id}: ${capture.failedRequests.length} failed request(s).`);
    }
    if (Array.isArray(capture?.blockedMutations) && capture.blockedMutations.length) {
      findings.push(
        `${id}: ${capture.blockedMutations.length} production mutation request(s) were blocked by Live Owner inspection.`
      );
    }
  }
  return findings.slice(0, 12);
}

function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    throw new Error("Invalid visual inspection URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("ARI visual inspection requires HTTPS.");
  }

  const host = url.hostname.toLowerCase();
  if (
    host !== "www.calbuddyhealth.com" &&
    host !== "calbuddyhealth.com" &&
    !host.endsWith(".vercel.app")
  ) {
    throw new Error("ARI can visually inspect only ARI XP production or Vercel preview hosts.");
  }

  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function normalizePath(value) {
  const raw = clean(value, 500) || "/home.html";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("..")) {
    throw new Error("Invalid visual inspection path.");
  }
  return raw;
}

function normalizeViewports(value) {
  const mode = clean(value, 40).toLowerCase();
  return ["mobile", "desktop", "both"].includes(mode) ? mode : "mobile";
}

function normalizeVisualMode(value) {
  return clean(value, 40).toLowerCase() === "live_owner"
    ? "live_owner"
    : "sandbox";
}

function createLiveOwnerGrant({
  req,
  authorization,
  requestId,
  baseUrl,
  liveOwnerExpiresAt = 0
}) {
  const accessToken = extractBearerToken(req);
  if (!accessToken) {
    throw liveGrantError(
      401,
      "LIVE_OWNER_AUTH_REQUIRED",
      "Live Owner inspection requires the current verified owner session."
    );
  }

  const jwt = parseJwtPayload(accessToken);
  const accessTokenExpiresAt = Number(jwt?.exp || 0) * 1000;
  const now = Date.now();

  if (!accessTokenExpiresAt || accessTokenExpiresAt - now < LIVE_MIN_ACCESS_TTL_MS) {
    throw liveGrantError(
      409,
      "LIVE_OWNER_TOKEN_TOO_CLOSE_TO_EXPIRY",
      "Refresh the owner session before starting Live Owner inspection."
    );
  }

  const grantExpiresAt = Math.min(
    now + LIVE_GRANT_TTL_MS,
    accessTokenExpiresAt - 60_000
  );

  const delegatedSessionExpiresAt =
    Number.isFinite(Number(liveOwnerExpiresAt)) &&
    Number(liveOwnerExpiresAt) > now
      ? Number(liveOwnerExpiresAt)
      : accessTokenExpiresAt - 60_000;

  const aiProcessingExpiresAt = Math.min(
    delegatedSessionExpiresAt,
    accessTokenExpiresAt - 60_000
  );

  const payload = {
    version: LIVE_GRANT_VERSION,
    requestId,
    baseUrl,
    accessToken,
    accessTokenExpiresAt,
    grantExpiresAt,
    aiProcessingAuthorization: {
      authorized: true,
      scope: "visual_owner_inspection",
      requestId,
      expiresAt: aiProcessingExpiresAt
    },
    user: {
      id: authorization?.user?.id || "",
      email: authorization?.user?.email || ""
    }
  };

  return encryptLiveOwnerPayload(payload);
}

function encryptLiveOwnerPayload(payload) {
  const key = liveGrantKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [
    LIVE_GRANT_VERSION,
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url")
  ].join(".");
}

function decryptLiveOwnerGrant(grant) {
  const parts = String(grant || "").split(".");
  if (parts.length !== 4 || parts[0] !== LIVE_GRANT_VERSION) {
    throw liveGrantError(401, "LIVE_OWNER_GRANT_INVALID", "Invalid Live Owner browser grant.");
  }

  try {
    const iv = Buffer.from(parts[1], "base64url");
    const ciphertext = Buffer.from(parts[2], "base64url");
    const tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || !ciphertext.length) {
      throw new Error("invalid_grant_shape");
    }

    const decipher = createDecipheriv("aes-256-gcm", liveGrantKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]).toString("utf8");

    return JSON.parse(plaintext);
  } catch {
    throw liveGrantError(401, "LIVE_OWNER_GRANT_INVALID", "Invalid Live Owner browser grant.");
  }
}

function liveGrantKey() {
  const secret = clean(
    process.env.ARI_VISUAL_LIVE_GRANT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    20_000
  );

  if (!secret) {
    throw liveGrantError(
      503,
      "LIVE_OWNER_GRANT_NOT_CONFIGURED",
      "Live Owner visual delegation is not configured."
    );
  }

  return createHash("sha256")
    .update(`ari-visual-live-owner-v1::${secret}`, "utf8")
    .digest();
}

function parseJwtPayload(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function liveGrantError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function normalizeActions(value) {
  const items = Array.isArray(value) ? value : [];
  return items.slice(0, MAX_ACTIONS).map(item => {
    const type = clean(item?.type, 40).toLowerCase();
    if (!["click_text", "click_role", "fill_label", "press", "scroll", "wait", "visit_path"].includes(type)) {
      return null;
    }

    const path =
      type === "visit_path"
        ? normalizeActionPath(item?.path)
        : "";

    if (type === "visit_path" && !path) return null;

    return {
      type,
      text: clean(item?.text, 180),
      role: clean(item?.role, 50),
      name: clean(item?.name, 180),
      label: clean(item?.label, 180),
      value: clean(item?.value, 500),
      key: clean(item?.key, 40),
      path,
      amount: Math.max(-2000, Math.min(2000, Number(item?.amount) || 0)),
      ms: Math.max(0, Math.min(3000, Number(item?.ms) || 0))
    };
  }).filter(Boolean);
}

function normalizeActionPath(value) {
  const raw = clean(value, 500);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("..")) {
    return "";
  }
  return raw;
}

function normalizeStringArray(value, maxItems, maxLength) {
  return (Array.isArray(value) ? value : [])
    .map(item => clean(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

async function githubFetch(url, token, options = {}) {
  return await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

async function safeJson(response) {
  return await response.json().catch(() => ({}));
}

function clean(value, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}
