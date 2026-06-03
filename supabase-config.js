// Supabase configuration
const SUPABASE_URL = 'https://qmyrfdhveqqkhsynhzci.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ol6fATXdLGiQiEKnImBwlA_Zq4544KA';

// Initialize Supabase client
window.calbuddySupabase = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY,
{
auth: {
persistSession: true,
autoRefreshToken: true,
detectSessionInUrl: true
}
}
);

// Logout helper
window.logoutUser = async function () {
try {
await window.calbuddySupabase.auth.signOut();
window.location.href = "index.html";
} catch (error) {
console.error("Logout error:", error);
}
};

// Check if user is signed in
window.getCurrentSession = async function () {
const { data, error } =
await window.calbuddySupabase.auth.getSession();

if (error) {
console.error(error);
return null;
}

return data.session;
};


