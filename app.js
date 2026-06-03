const questions = [
"You have 850 calories left. Need dinner ideas?",
"Need help estimating a meal?",
"Can you still fit dessert today?",
"Want a lighter dinner option?",
"Need help staying on track?",
"What should you eat after a workout?"
];

let index = 0;
const questionBox = document.getElementById("calbuddy-question");

if (questionBox) {
setInterval(() => {
index = (index + 1) % questions.length;
questionBox.textContent = `"${questions[index]}"`;
}, 4000);
}

document.addEventListener("DOMContentLoaded", async () => {
const supabase = window.calbuddySupabase;

setupAuthButton(supabase);
updateHomeCaloriesFromGoals();
await loadProfileFromSupabase(supabase);
setupSaveGoalsButton(supabase);
});

async function setupAuthButton(supabase) {
const authButton = document.getElementById("authButton");
if (!authButton || !supabase) return;

const { data, error } = await supabase.auth.getSession();

if (error) {
console.log("Session error:", error);
return;
}

if (data.session) {
authButton.textContent = "Logout";

authButton.onclick = async () => {
await supabase.auth.signOut();
window.location.href = "index.html";
};
} else {
authButton.textContent = "👤 Sign In";

authButton.onclick = () => {
window.location.href = "signin.html";
};
}
}

function updateHomeCaloriesFromGoals() {
const savedGoal = localStorage.getItem("calbuddyDailyCalorieGoal");
const savedConsumed = localStorage.getItem("calbuddyCaloriesConsumed") || 0;

if (!savedGoal) return;

const goal = Number(savedGoal);
const consumed = Number(savedConsumed);
const caloriesLeft = Math.max(goal - consumed, 0);

const dailyGoalText = document.getElementById("dailyGoalText");
const dailyGoalConsumed = document.getElementById("dailyGoalConsumed");
const caloriesConsumedText = document.getElementById("caloriesConsumedText");
const caloriesLeftText = document.getElementById("caloriesLeftText");

if (dailyGoalText) dailyGoalText.textContent = goal.toLocaleString();
if (dailyGoalConsumed) dailyGoalConsumed.textContent = goal.toLocaleString();
if (caloriesConsumedText) caloriesConsumedText.textContent = consumed.toLocaleString();
if (caloriesLeftText) caloriesLeftText.textContent = caloriesLeft.toLocaleString();
}

async function loadProfileFromSupabase(supabase) {
if (!supabase) return;

const { data: sessionData } = await supabase.auth.getSession();
const user = sessionData?.session?.user;

if (!user) return;

const { data: profile, error } = await supabase
.from("profiles")
.select("*")
.eq("id", user.id)
.single();

if (error) {
console.log("Profile load error:", error);
return;
}

if (!profile) return;

setValue("name", profile.name);
setValue("age", profile.age);
setValue("sex", profile.sex);
setValue("currentWeight", profile.weight_lbs);
setValue("heightIn", profile.height_in);
setValue("activityLevel", profile.activity_level);
setValue("goal", profile.goal);
setValue("targetWeight", profile.target_weight_lbs);
setValue("weeklyWeightChangeGoal", profile.weekly_weight_change_goal);

if (profile.daily_calorie_goal) {
localStorage.setItem("calbuddyDailyCalorieGoal", profile.daily_calorie_goal);
updateHomeCaloriesFromGoals();
}
}

function setupSaveGoalsButton(supabase) {
const saveButton = document.getElementById("saveGoalsButton");

if (!saveButton) return;

saveButton.addEventListener("click", async () => {
const dailyCalorieGoal = calculateDailyCalorieGoal();

localStorage.setItem("calbuddyDailyCalorieGoal", dailyCalorieGoal);
updateHomeCaloriesFromGoals();

if (!supabase) {
alert("Saved on this device only. Supabase is not connected.");
return;
}

const { data: sessionData } = await supabase.auth.getSession();
const user = sessionData?.session?.user;

if (!user) {
alert("Saved on this device. Sign in to save to your account.");
return;
}

const profileData = {
id: user.id,
name: getValue("name") || null,
age: getNumber("age"),
sex: getValue("sex") || null,
weight_lbs: getNumber("currentWeight"),
height_in: getNumber("heightIn"),
activity_level: getValue("activityLevel") || null,
goal: getValue("goal") || null,
target_weight_lbs: getNumber("targetWeight"),
weekly_weight_change_goal: getNumber("weeklyWeightChangeGoal"),
daily_calorie_goal: dailyCalorieGoal,
updated_at: new Date().toISOString()
};

const { error } = await supabase
.from("profiles")
.upsert(profileData, { onConflict: "id" });

if (error) {
console.log("Save profile error:", error);
alert("Something went wrong saving your goals.");
return;
}

alert("Goals saved.");
});
}

function calculateDailyCalorieGoal() {
const age = getNumber("age") || 30;
const sex = getValue("sex") || "Male";
const weight = getNumber("currentWeight") || 199;
const height = getNumber("heightIn") || 69.8;
const activity = getValue("activityLevel") || "Moderately Active";
const weeklyChange = getNumber("weeklyWeightChangeGoal") || 1;

const weightKg = weight / 2.20462;
const heightCm = height * 2.54;

let bmr;

if (sex.toLowerCase() === "female") {
bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
} else {
bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

const activityMultipliers = {
"Sedentary": 1.2,
"Lightly Active": 1.375,
"Moderately Active": 1.55,
"Very Active": 1.725,
"Extra Active": 1.9
};

const multiplier = activityMultipliers[activity] || 1.55;
const maintenanceCalories = bmr * multiplier;

const goal = getValue("goal") || "Maintain Weight";

let calorieAdjustment = 0;

if (goal === "Lose Weight") {
calorieAdjustment = weeklyChange * 500;
} else if (goal === "Gain Weight") {
calorieAdjustment = -weeklyChange * 500;
}

return Math.round(maintenanceCalories - calorieAdjustment);
}

function getValue(id) {
const el = document.getElementById(id);
return el ? el.value : "";
}

function getNumber(id) {
const value = getValue(id);
return value === "" ? null : Number(value);
}

function setValue(id, value) {
const el = document.getElementById(id);
if (el && value !== null && value !== undefined) {
el.value = value;
}
}
