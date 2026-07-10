// =====================================================
// ARI REBIRTH
// File: identity.js
// Version: 1.0.0
// Purpose: Identity page behavior and Supabase profile saving.
// =====================================================

const IDENTITY_VERSION = "1.0.0";

let selectedInterests = [];

document.addEventListener("DOMContentLoaded", async () => {
  setupInterestChips();
  await loadIdentity();
});

function goHome() {
  window.location.replace("home.html");
}

function setStatus(message = "", type = "") {
  const statusEl = document.getElementById("identityStatus");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("error", "success");

  if (type) {
    statusEl.classList.add(type);
  }
}

async function getSessionOrRedirect() {
  if (typeof requireAuth === "function") {
    return await requireAuth();
  }

  if (!window.calbuddySupabase) {
    setStatus(
      "Supabase is not loaded. Check supabase-config.js.",
      "error"
    );
    return null;
  }

  const {
    data: { session },
    error
  } = await window.calbuddySupabase.auth.getSession();

  if (error) {
    setStatus(error.message, "error");
    return null;
  }

  if (!session) {
    window.location.replace("signin.html");
    return null;
  }

  return session;
}

function setupInterestChips() {
  document.querySelectorAll(".ari-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const interest = chip.dataset.interest;
      if (!interest) return;

      chip.classList.toggle("active");

      if (chip.classList.contains("active")) {
        if (!selectedInterests.includes(interest)) {
          selectedInterests.push(interest);
        }
      } else {
        selectedInterests = selectedInterests.filter(
          (item) => item !== interest
        );
      }
    });
  });
}

function setField(id, value = "") {
  const element = document.getElementById(id);

  if (element) {
    element.value = value || "";
  }
}

function getField(id) {
  const element = document.getElementById(id);

  return element
    ? String(element.value || "").trim()
    : "";
}

function applyInterestChips(interestsText = "") {
  const normalized = String(interestsText || "").toLowerCase();

  selectedInterests = [];

  document.querySelectorAll(".ari-chip").forEach((chip) => {
    const interest = chip.dataset.interest;
    if (!interest) return;

    const active = normalized.includes(
      interest.toLowerCase()
    );

    chip.classList.toggle("active", active);

    if (active) {
      selectedInterests.push(interest);
    }
  });
}

function buildInterestsValue() {
  const typed = getField("interests");
  const chipText = selectedInterests.join(", ");

  if (chipText && typed) {
    return `${chipText}. ${typed}`;
  }

  return chipText || typed;
}

async function loadIdentity() {
  const session = await getSessionOrRedirect();
  if (!session) return;

  setStatus("Loading identity...");

  const { data, error } = await window.calbuddySupabase
    .from("profiles")
    .select(
      "display_name,birthday,pronouns,location,occupation,languages,interests,about_me"
    )
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.warn(
      "Identity load warning:",
      error.message
    );

    setField(
      "displayName",
      session.user?.user_metadata?.display_name || ""
    );

    setStatus(
      "Identity ready. Some fields may not be available yet."
    );

    return;
  }

  setField(
    "displayName",
    data?.display_name ||
      session.user?.user_metadata?.display_name ||
      ""
  );

  setField("birthday", data?.birthday || "");
  setField("pronouns", data?.pronouns || "");
  setField("location", data?.location || "");
  setField("occupation", data?.occupation || "");
  setField("languages", data?.languages || "");
  setField("interests", data?.interests || "");
  setField("aboutMe", data?.about_me || "");

  applyInterestChips(data?.interests || "");

  setStatus("Identity loaded.", "success");
}

async function saveIdentity() {
  const session = await getSessionOrRedirect();
  if (!session) return;

  const displayName = getField("displayName");

  if (!displayName) {
    setStatus(
      "Please enter what Ari should call you.",
      "error"
    );
    return;
  }

  setStatus("Saving identity...");

  const payload = {
    id: session.user.id,
    email: session.user.email || null,
    display_name: displayName,
    birthday: getField("birthday") || null,
    pronouns: getField("pronouns") || null,
    location: getField("location") || null,
    occupation: getField("occupation") || null,
    languages: getField("languages") || null,
    interests: buildInterestsValue() || null,
    about_me: getField("aboutMe") || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await window.calbuddySupabase
    .from("profiles")
    .upsert(payload, {
      onConflict: "id"
    });

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  const { error: metadataError } =
    await window.calbuddySupabase.auth.updateUser({
      data: {
        display_name: displayName
      }
    });

  if (metadataError) {
    console.warn(
      "Display-name metadata warning:",
      metadataError.message
    );
  }

  setStatus(
    "Identity saved. Ari will remember what you shared.",
    "success"
  );
}