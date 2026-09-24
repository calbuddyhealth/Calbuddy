import { randomUUID } from "node:crypto";
import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";
import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

const WORKFLOW_FILE = "ari-visual-inspector.yml";
const MAX_INSTRUCTION = 1200;
const MAX_ACTIONS = 8;
const MAX_LOG_CHARS = 5_000_000;

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      code: "METHOD_NOT_ALLOWED",
      error: "Method not allowed."
    });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization.authorized) {
    return sendOwnerAuthorizationError(res, authorization);
  }

  const token = clean(process.env.GITHUB_TOKEN, 8000);
  const repo = clean(process.env.GITHUB_REPO, 300);
  const branch = clean(process.env.GITHUB_BRANCH, 200) || "main";

  if (!token || !repo) {
    return res.status(503).json({
      success: false,
      code: "VISUAL_INSPECTOR_NOT_CONFIGURED",
      error: "ARI visual inspection requires the existing GitHub developer connection."
    });
  }

  const action = clean(req.body?.action, 40).toLowerCase() || "start";

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
    return res.status(500).json({
      success: false,
      code: "ARI_VISUAL_INSPECTOR_FAILED",
      error: error?.message || "ARI visual inspection failed."
    });
  }
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
          auth_mode: "mock_owner",
          instruction,
          actions_b64: actionsB64
        }
      })
    }
  );

  if (!response.ok) {
    const body = await safeJson(response);
    return res.status(response.status).json({
      success: false,
      code: "VISUAL_WORKFLOW_DISPATCH_FAILED",
      error: body?.message || "Could not start ARI visual inspection."
    });
  }

  return res.status(202).json({
    success: true,
    status: "queued",
    requestId,
    targetPath,
    baseUrl,
    viewports,
    readOnlySandbox: true,
    authorizationMode: authorization.mode,
    message: `ARI visual inspection started for ${targetPath}.`
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

  const visualAnalysis = await analyzeVisualEvidence({
    report,
    instruction: instruction || report.instruction,
    userId: authorization.user?.id || null
  });

  return res.status(200).json({
    success: true,
    status: "completed",
    requestId,
    runId: run.id,
    authorizationMode: authorization.mode,
    readOnlySandbox: true,
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
  const marker = "ARI_VISUAL_RESULT:";
  const index = logs.lastIndexOf(marker);
  if (index < 0) return null;

  const encoded = logs
    .slice(index + marker.length)
    .split(/\r?\n/)[0]
    .trim();

  try {
    const json = Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function analyzeVisualEvidence({ report, instruction, userId }) {
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

  const captures = Array.isArray(report?.captures) ? report.captures.slice(0, 2) : [];
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
        viewport: item.viewport,
        url: item.url,
        title: item.title,
        bodyText: clean(item.bodyText, 3500),
        metrics: item.metrics,
        interactive: Array.isArray(item.interactive) ? item.interactive.slice(0, 40) : [],
        navigation: Array.isArray(item.navigation) ? item.navigation.slice(0, 30) : [],
        consoleErrors: item.consoleErrors || [],
        failedRequests: item.failedRequests || []
      }))
    },
    null,
    2
  ).slice(0, 18000);

  const systemPrompt = `
You are ARI XP's Visual App Inspector.
You are looking at screenshots captured by a read-only Playwright owner sandbox plus exact DOM/layout evidence.

Your job is to visually inspect the UI, not merely summarize markup.
Prioritize:
- clipping, horizontal overflow, zoom/viewport problems
- overlapping or cut-off content
- awkward spacing, hierarchy, density, alignment, and responsiveness
- controls that are hidden, duplicated, visually confusing, or difficult to reach
- differences between mobile and desktop when both are provided
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
      viewportMode:
        captures.length > 1 ? "both" : captures[0]?.viewport?.id || "unknown",
      readOnlySandbox: true
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

function compactReport(report) {
  return {
    version: report?.version || null,
    requestId: report?.requestId || null,
    generatedAt: report?.generatedAt || null,
    baseUrl: report?.baseUrl || null,
    targetPath: report?.targetPath || null,
    authMode: report?.authMode || null,
    actionsApplied: report?.actionsApplied || [],
    captures: (Array.isArray(report?.captures) ? report.captures : []).map(item => ({
      viewport: item.viewport,
      url: item.url,
      title: item.title,
      metrics: item.metrics,
      interactive: Array.isArray(item.interactive) ? item.interactive.slice(0, 50) : [],
      navigation: Array.isArray(item.navigation) ? item.navigation.slice(0, 40) : [],
      consoleErrors: item.consoleErrors || [],
      failedRequests: item.failedRequests || [],
      screenshotAvailable: Boolean(item.screenshotDataUrl)
    }))
  };
}

function structuralFindings(report) {
  const findings = [];
  for (const capture of Array.isArray(report?.captures) ? report.captures : []) {
    const id = capture?.viewport?.id || "viewport";
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

function normalizeActions(value) {
  const items = Array.isArray(value) ? value : [];
  return items.slice(0, MAX_ACTIONS).map(item => {
    const type = clean(item?.type, 40).toLowerCase();
    if (!["click_text", "click_role", "fill_label", "press", "scroll", "wait"].includes(type)) {
      return null;
    }
    return {
      type,
      text: clean(item?.text, 180),
      role: clean(item?.role, 50),
      name: clean(item?.name, 180),
      label: clean(item?.label, 180),
      value: clean(item?.value, 500),
      key: clean(item?.key, 40),
      amount: Math.max(-2000, Math.min(2000, Number(item?.amount) || 0)),
      ms: Math.max(0, Math.min(3000, Number(item?.ms) || 0))
    };
  }).filter(Boolean);
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
