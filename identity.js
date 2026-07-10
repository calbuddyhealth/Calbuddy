// =====================================================
// ARI REBIRTH
// File: identity.js
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
    setStatus("Supabase is not loaded. Check supabase-config.js.", "error");
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
        selectedInterests = selectedInterests.filter((item) => item !== interest);
      }
    });
  });
}

function setField(id, value = "") {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function getField(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function applyInterestChips(interestsText = "") {
  const normalized = String(interestsText || "").toLowerCase();

  document.querySelectorAll(".ari-chip").forEach((chip) => {
    const interest = chip.dataset.interest;
    if (!interest) return;

    const active = normalized.includes(interest.toLowerCase());

    chip.classList.toggle("active", active);

    if (active && !selectedInterests.includes(interest)) {
      selectedInterests.push(interest);
    }
  });
}

function buildInterestsValue() {
  const typed = getField("interests");
  const chipText = selectedInterests.join(", ");

  if (chipText && typed) return chipText + ". " + typed;
  if (chipText) return chipText;

  return typed;
}

async function loadIdentity() {
  const session = await getSessionOrRedirect();
  if (!session) return;

  setStatus("Loading identity...", "");

  const { data, error } = await window.calbuddySupabase
    .from("profiles")
    .select("display_name,birthday,pronouns,location,occupation,languages,interests,about_me")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.warn("Identity load warning:", error.message);
    setStatus("Identity ready. Some fields may need database columns before cloud save works.", "");
    return;
  }

  setField("displayName", data?.display_name || session.user?.user_metadata?.display_name || "");
  setField("birthday", data?.birthday || "");
  setField("pronouns", data?.pronouns || "");
  setField("location", data?.location || "");
  setField("occupation", data?.occupation || "");
  setField("languages", data?.languages || "");
  setField("interests", data?.interests || "");
  setField("aboutMe", data?.about_me || "");

  selectedInterests = [];
  applyInterestChips(data?.interests || "");

  setStatus("Identity loaded.", "success");
}

async function saveIdentity() {
  const session = await getSessionOrRedirect();
  if (!session) return;

  const displayName = getField("displayName");

  if (!displayName) {
    setStatus("Please enter what Ari should call you.", "error");
    return;
  }

  setStatus("Saving identity...", "");

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
    .upsert(payload, { onConflict: "id" });

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  await window.calbuddySupabase.auth.updateUser({
    data: {
      display_name: displayName
    }
  });

  setStatus("Identity saved. Ari will remember what you shared.", "success");
}

/*
=====================================================
ARI REBIRTH
File: identity.js
Version: 1.0.0

Purpose:
  Controls the My Identity page.

Responsibilities:
  - Load authenticated user
  - Load profile information
  - Save display name
  - Change email
  - Reset password
  - Log out

Dependencies:
  - Supabase
  - supabase-config.js
=====================================================
*/

document.addEventListener("DOMContentLoaded", loadProfile);

async function loadProfile() {
  const { data, error } =
    await window.calbuddySupabase.auth.getSession();

  if (error || !data?.session) {
    window.location.href = "signin.html";
    return;
  }

  const user = data.session.user;

  document.getElementById("userEmail").textContent =
    user.email || "No email found.";

  const { data: profile, error: profileError } =
    await window.calbuddySupabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

  if (profileError) {
    console.warn("Profile load warning:", profileError.message);
    return;
  }

  document.getElementById("displayName").value =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    "";
}

async function saveDisplayName() {
  const statusEl = document.getElementById("profileStatus");
  statusEl.textContent = "";

  const {
    data: { session },
    error: sessionError
  } = await window.calbuddySupabase.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "signin.html";
    return;
  }

  const displayName =
    document.getElementById("displayName").value.trim();

  if (!displayName) {
    statusEl.textContent =
      "Please enter what Ari should call you.";
    return;
  }

  const { error } =
    await window.calbuddySupabase
      .from("profiles")
      .upsert(
        {
          id: session.user.id,
          email: session.user.email,
          display_name: displayName,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "id"
        }
      );

  if (error) {
    statusEl.textContent = error.message;
    return;
  }

  await window.calbuddySupabase.auth.updateUser({
    data: {
      display_name: displayName
    }
  });

  statusEl.textContent = "Display name updated.";
}

async function logoutUser() {
  await window.calbuddySupabase.auth.signOut();

  sessionStorage.removeItem("ari_boot_intro");

  window.location.href = "signin.html";
}

async function resetPassword() {
  const { data } =
    await window.calbuddySupabase.auth.getSession();

  if (!data?.session) {
    window.location.href = "signin.html";
    return;
  }

  const email = data.session.user.email;

  await window.calbuddySupabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo:
        window.location.origin +
        "/reset-password.html"
    }
  );

  alert("Password reset email sent.");
}

async function changeEmail() {
  const newEmail =
    prompt("Enter your new email address:");

  if (!newEmail) return;

  const { error } =
    await window.calbuddySupabase.auth.updateUser({
      email: newEmail
    });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Confirmation email sent to your new address.");
}