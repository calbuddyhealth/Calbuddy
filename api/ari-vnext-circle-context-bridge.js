// ARI Next production context bridge.
// The publishable Supabase URL/key are public browser configuration, not secrets.
// This bridge only supplies missing project transport configuration; the original
// handler still requires the signed-in user's Bearer JWT and every Circle RPC
// continues to execute under that user's authorization context.

import handler from "./ari-vnext-circle-context.js";

const PUBLIC_SUPABASE_URL = "https://qmyrfdhveqqkhsynhzci.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ol6fATXdLGiQiEKnImBwlA_Zq4544KA";

if (!String(process.env.SUPABASE_URL || "").trim()) {
  process.env.SUPABASE_URL = PUBLIC_SUPABASE_URL;
}

if (
  !String(process.env.SUPABASE_ANON_KEY || "").trim() &&
  !String(process.env.SUPABASE_PUBLISHABLE_KEY || "").trim()
) {
  process.env.SUPABASE_PUBLISHABLE_KEY = PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

export default handler;
