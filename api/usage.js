// ARI XP Usage API
// V2.0.0 — New verified accounts fail open to the standard free limit while
// the minimal app profile is being provisioned. Missing profiles no longer
// surface "Profile not found" to Ari conversations.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      user_id,
      action = "check",
      message = "",
      usage_type = "chat",
      model = "gpt-4o-mini"
    } = req.body;

    if (!user_id) return res.status(400).json({ error: "Missing user_id." });

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Missing Supabase environment variables." });
    }

    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const profileRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user_id)}&select=is_admin,ai_unlimited,subscription_status,ai_daily_limit,ai_trial_ends_at`,
      { headers }
    );

    const profiles = await profileRes.json().catch(() => []);
    const profile = Array.isArray(profiles) ? profiles[0] : null;

    if (!profileRes.ok) {
      console.warn("[ARI Usage] Profile lookup failed; using standard free limits.", {
        status: profileRes.status,
        user_id
      });
    }

    // A brand-new verified Auth user can exist for a moment before the app's
    // minimal profiles row is created. That provisioning race must not block
    // conversation. Missing profile = ordinary free account, never unlimited.
    const unlimited = Boolean(
      profile && (
        profile.is_admin ||
        profile.ai_unlimited ||
        profile.subscription_status === "active" ||
        (profile.ai_trial_ends_at && new Date(profile.ai_trial_ends_at) > new Date())
      )
    );

    const today = new Date().toISOString().split("T")[0];

    const usageRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${encodeURIComponent(user_id)}&created_at=gte.${today}T00:00:00.000Z&usage_type=eq.${encodeURIComponent(usage_type)}`,
      { headers }
    );

    const usageLogs = await usageRes.json().catch(() => []);
    const usedToday = Array.isArray(usageLogs) ? usageLogs.length : 0;
    const dailyLimit = Number(profile?.ai_daily_limit || 25);

    if (!unlimited && usedToday >= dailyLimit) {
      return res.status(200).json({
        allowed: false,
        unlimited: false,
        usedToday,
        dailyLimit,
        message: "You’ve reached today’s free AI limit."
      });
    }

    if (action === "log") {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id,
          message,
          model,
          usage_type,
          tokens_used: 0,
          cost_estimate: 0
        })
      });
    }

    return res.status(200).json({
      allowed: true,
      unlimited,
      usedToday: action === "log" ? usedToday + 1 : usedToday,
      dailyLimit,
      profileReady: Boolean(profile)
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Usage API failed."
    });
  }
}
