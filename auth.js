// Auth helper functions

// Sign up with email and password
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, user: data.user };
}

// Log in with email and password
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, user: data.user };
}

// Log out
async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// Get current session
async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    return null;
  }
  
  return session?.user || null;
}

// Check if user is authenticated
async function isUserAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}
