export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, user_id, action_type, payload = {} } = req.body;

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Missing Supabase server environment variables."
      });
    }

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id." });
    }

    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    if (action === "create_pending_action") {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/ai_app_actions`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          user_id,
          action_type,
          status: "pending",
          payload,
          confirmation_text: payload.confirmation_text || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        pendingAction: data?.[0] || null
      });
    }

    if (action === "log_meal") {
      const meal = {
        user_id,
        name: payload.name || "CalBuddy meal",
        calories: Number(payload.calories || 0),
        category: payload.category || "Meal",
        nutrition_date: payload.nutrition_date || new Date().toISOString().split("T")[0],
        protein_g: Number(payload.protein_g || 0),
        carbs_g: Number(payload.carbs_g || 0),
        fat_g: Number(payload.fat_g || 0),
        serving_size: payload.serving_size || "Added by CalBuddy",
        multiplier: Number(payload.multiplier || 1),
        is_favorite: false,
        created_at: new Date().toISOString()
      };

      if (!meal.calories || meal.calories <= 0) {
        return res.status(400).json({ error: "Meal calories are required." });
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/meals`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify(meal)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        meal: data?.[0] || null
      });
    }

    if (action === "update_profile") {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          ...payload,
          updated_at: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        profile: data?.[0] || null
      });
    }

    if (action === "log_weight") {
      const entry = {
        user_id,
        weight: Number(payload.weight),
        notes: payload.notes || "",
        log_date: payload.log_date || new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString()
      };

      if (!entry.weight || entry.weight <= 0) {
        return res.status(400).json({ error: "Valid weight is required." });
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/weight_logs`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify(entry)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        weightLog: data?.[0] || null
      });
    }

    if (action === "log_calories_burned") {
      const entry = {
        user_id,
        calories_burned: Number(payload.calories_burned || 0),
        activity_name: payload.activity_name || "Activity",
        log_date: payload.log_date || new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString()
      };

      if (!entry.calories_burned || entry.calories_burned <= 0) {
        return res.status(400).json({ error: "Calories burned are required." });
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/activity_logs`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify(entry)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        success: true,
        activityLog: data?.[0] || null
      });
    }

    return res.status(400).json({
      error: "Unknown action."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Actions API failed."
    });
  }
}
