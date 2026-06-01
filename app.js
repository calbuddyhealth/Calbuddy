const sampleFoods = [
  { name: "Zucchini", serving: "1 cup sliced", calories: 33, protein: 2.4, carbs: 6.1, fat: 0.6 },
  { name: "Grilled Chicken Breast", serving: "6 oz", calories: 280, protein: 53, carbs: 0, fat: 6 },
  { name: "White Rice", serving: "1 cup cooked", calories: 206, protein: 4.3, carbs: 45.8, fat: 0.3 },
  { name: "Sweet Potato", serving: "1 medium", calories: 103, protein: 2.3, carbs: 23.6, fat: 0.1 },
  { name: "Broccoli", serving: "1 cup chopped", calories: 34, protein: 3.7, carbs: 6.6, fat: 0.4 },
  { name: "Salmon", serving: "6 oz", calories: 385, protein: 42, carbs: 0, fat: 22 },
  { name: "Eggs", serving: "2 large", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: "Olive Oil", serving: "1 tbsp", calories: 119, protein: 0, carbs: 0, fat: 13.5 },
  { name: "Almonds", serving: "1 oz (23 nuts)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Banana", serving: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 }
];

let currentProfile = null;

// Initialize app and check for logged-in user
async function initApp() {
  const user = await getCurrentUser();
  
  if (user) {
    // Load profile from Supabase for authenticated user
    await loadProfileFromSupabase(user.id);
    showScreen("home");
  } else {
    // Check for profile in localStorage for non-authenticated users
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      currentProfile = JSON.parse(savedProfile);
      showScreen("home");
    } else {
      showScreen("setup");
    }
  }
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  const target = document.getElementById(screenId);
  if (target) target.classList.remove("hidden");
  
  // Reload profile on home screen
  if (screenId === "home") {
    loadHomeScreen();
  }
}

// Setup form: save profile to Supabase if logged in, otherwise to localStorage
document.getElementById("setupForm").addEventListener("submit", async e => {
  e.preventDefault();
  
  const profile = {
    full_name: document.getElementById("name").value || "Friend",
    height_inches: document.getElementById("height").value || 0,
    weight_lbs: document.getElementById("weight").value || 0,
    goal: document.getElementById("goal").value || "Lose Weight",
    diet_style: document.getElementById("diet").value || "Balanced Nutrition",
    display_mode: document.getElementById("displayMode").value || "Simple",
    relationship_mode: document.getElementById("relationshipMode").checked || false
  };
  
  const user = await getCurrentUser();
  
  if (user) {
    // Save to Supabase profiles table
    const { error } = await window.calbuddySupabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: profile.full_name,
          height_inches: profile.height_inches,
          weight_lbs: profile.weight_lbs,
          goal: profile.goal,
          diet_style: profile.diet_style,
          display_mode: profile.display_mode,
          relationship_mode: profile.relationship_mode,
          updated_at: new Date().toISOString()
        },
        { onConflict: ["id"] }
      );
    
    if (error) {
      alert("Error saving profile: " + error.message);
      return;
    }
  } else {
    // Save to localStorage if not logged in
    localStorage.setItem("userProfile", JSON.stringify(profile));
  }
  
  currentProfile = profile;
  showScreen("home");
});

// Load profile from Supabase
async function loadProfileFromSupabase(userId) {
  const { data, error } = await window.calbuddySupabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (error && error.code !== "PGRST116") {
    console.error("Error loading profile:", error);
    return;
  }
  
  if (data) {
    currentProfile = {
      full_name: data.full_name || "Friend",
      height_inches: data.height_inches || 0,
      weight_lbs: data.weight_lbs || 0,
      goal: data.goal || "Lose Weight",
      diet_style: data.diet_style || "Balanced Nutrition",
      display_mode: data.display_mode || "Simple",
      relationship_mode: data.relationship_mode || false
    };
  }
}

// Load and display profile on home screen
async function loadHomeScreen() {
  const user = await getCurrentUser();
  
  if (user && !currentProfile) {
    await loadProfileFromSupabase(user.id);
  }
  
  if (currentProfile) {
    document.getElementById("greetingName").textContent = currentProfile.full_name + " 👋";
    document.getElementById("goalText").textContent = currentProfile.goal;
    document.getElementById("dietText").textContent = currentProfile.diet_style;
  }
}

// Search for foods
function searchFood() {
  const query = document.getElementById("foodSearch").value.trim().toLowerCase();
  const results = document.getElementById("foodResults");
  results.innerHTML = "";
  
  const matches = sampleFoods.filter(food =>
    food.name.toLowerCase().includes(query) ||
    food.serving.toLowerCase().includes(query)
  );
  
  matches.forEach(food => {
    const item = document.createElement("div");
    item.className = "food-item";
    item.innerHTML = `
      <strong>${food.name}</strong><br>
      Serving: ${food.serving}<br>
      Calories: ${food.calories} | Protein: ${food.protein}g | Carbs: ${food.carbs}g | Fat: ${food.fat}g
    `;
    results.appendChild(item);
  });
}
async function handleSignup() {
const email = document.getElementById("authEmail").value.trim();
const password = document.getElementById("authPassword").value.trim();
const message = document.getElementById("authMessage");

if (!email || !password) {
message.textContent = "Enter an email and password.";
return;
}

const result = await signUp(email, password);

if (!result.success) {
message.textContent = result.error;
return;
}

message.textContent = "Account created. Check your email if confirmation is required.";
}

async function handleLogin() {
const email = document.getElementById("authEmail").value.trim();
const password = document.getElementById("authPassword").value.trim();
const message = document.getElementById("authMessage");

if (!email || !password) {
message.textContent = "Enter an email and password.";
return;
}

const result = await signIn(email, password);

if (!result.success) {
message.textContent = result.error;
return;
}

message.textContent = "Logged in successfully.";
showScreen("setup");
}
// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
