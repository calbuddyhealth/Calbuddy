// CalBuddy Auth Helper Functions

async function signUp(email, password) {
  const { data, error } = await window.calbuddySupabase.auth.signUp({
    email,
    password
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await createUserProfile(data.user);
  }

  return { success: true, user: data.user };
}

async function signIn(email, password) {
  const { data, error } = await window.calbuddySupabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await createUserProfile(data.user);
  }

  return { success: true, user: data.user };
}

async function signOut() {
  const { error } = await window.calbuddySupabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function getCurrentUser() {
  const {
    data: { session },
    error
  } = await window.calbuddySupabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session.user;
}

async function isUserAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}

async function createUserProfile(user) {
  if (!user || !user.id) return;

  const { error } = await window.calbuddySupabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "id"
      }
    );

  if (error) {
    console.log("Profile save error:", error.message);
  }
}
