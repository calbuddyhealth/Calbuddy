import { DEFAULT_AUTH_CACHE_LEASES_MS as defaults, runAuthorizationCacheExperiment as run } from "../server/ari-authorization-cache-experiment.js";
const i = process.argv.indexOf("--leases");
const leases = i >= 0 && process.argv[i + 1] ? process.argv[i + 1].split(",").map(Number).filter(v => Number.isFinite(v) && v >= 0) : defaults;
const report = run({ leaseDurationsMs: leases.length ? leases : defaults });
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else { console.log("ARI authorization-cache failure experiment"); console.table(report.summary); }
