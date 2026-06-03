// Supabase configuration

const SUPABASE_URL = "https://qmyrfdhveqqkhsynhzci.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ol6fATXdLGiQiEKnImBwlA_Zq4544KA";

window.calbuddySupabase = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY,
{
auth: {
persistSession: true,
autoRefreshToken: true,
detectSessionInUrl: true,
storage: window.localStorage,
storageKey: "calbuddy-auth-session"
}
}
);

// Get current session
window.getCurrentSession = async function () {
const { data, error } = await window.calbuddySupabase.auth.getSession();

if (error) {
console.error("Session error:", error.message);
return null;
}

return data.session;
};

// Get current user
window.getCurrentUser = async function () {
const session = await window.getCurrentSession();
return session?.user || null;
};

// Check if signed in
window.isSignedIn = async function () {
const user = await window.getCurrentUser();
return !!user;
};

// Logout helper
window.logoutUser = async function () {
try {
const { error } = await window.calbuddySupabase.auth.signOut();

if (error) {
console.error("Logout error:", error.message);
return;
}

window.location.href = "index.html";
} catch (error) {
console.error("Logout error:", error);
}
};

// Keep session fresh
window.calbuddySupabase.auth.onAuthStateChange((event, session) => {
console.log("Auth event:", event);

if (session?.user) {
localStorage.setItem("calbuddyLastUserId", session.user.id);
localStorage.setItem("calbuddyLastUserEmail", session.user.email || "");
}

if (event === "SIGNED_OUT") {
localStorage.removeItem("calbuddyLastUserId");
localStorage.removeItem("calbuddyLastUserEmail");
}
});
