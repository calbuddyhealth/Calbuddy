// calbuddy-core.js
// Shared CalBuddy app brain: auth, reset windows, meals, goals, weight, burned calories, and AI context.

window.CalBuddy = window.CalBuddy || {};

CalBuddy.safeNumber = function (value, fallback = 0) {
const number = Number(value);
return Number.isFinite(number) ? number : fallback;
};

CalBuddy.formatLocalDate = function (date) {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");
return `${year}-${month}-${day}`;
};

CalBuddy.getCurrentUser = async function () {
if (window.getCurrentUser) return await window.getCurrentUser();
if (!window.calbuddySupabase) return null;

const { data, error } = await window.calbuddySupabase.auth.getSession();
if (error || !data.session) return null;

return data.session.user;
};

CalBuddy.getResetTime = async function () {
const saved = localStorage.getItem("calbuddyResetTime");
const user = await CalBuddy.getCurrentUser();

if (user && window.calbuddySupabase) {
const { data, error } = await window.calbuddySupabase
.from("profiles")
.select("reset_hour, reset_minute, reset_ampm")
.eq("id", user.id)
.maybeSingle();

if (!error && data) {
const resetTime = {
hour: CalBuddy.safeNumber(data.reset_hour, 4),
minute: CalBuddy.safeNumber(data.reset_minute, 0),
ampm: data.reset_ampm || "AM"
};

localStorage.setItem("calbuddyResetTime", JSON.stringify(resetTime));
return resetTime;
}
}

if (saved) {
try {
return JSON.parse(saved);
} catch {
return { hour: 4, minute: 0, ampm: "AM" };
}
}

return { hour: 4, minute: 0, ampm: "AM" };
};

CalBuddy.convertTo24Hour = function (hour, ampm) {
hour = Number(hour);
if (ampm === "AM" && hour === 12) return 0;
if (ampm === "PM" && hour !== 12) return hour + 12;
return hour;
};

CalBuddy.getNutritionWindow = async function (offset = 0) {
const reset = await CalBuddy.getResetTime();
const resetHour24 = CalBuddy.convertTo24Hour(reset.hour, reset.ampm);

const now = new Date();

const start = new Date();
start.setHours(resetHour24, Number(reset.minute), 0, 0);

if (now < start) {
start.setDate(start.getDate() - 1);
}

start.setDate(start.getDate() + offset);

const end = new Date(start);
end.setDate(end.getDate() + 1);

const resetKey =
`${String(resetHour24).padStart(2, "0")}${String(reset.minute).padStart(2, "0")}`;

return {
start,
end,
dateKey: `${CalBuddy.formatLocalDate(start)}_${resetKey}`,
nutritionDate: CalBuddy.formatLocalDate(start)
};
};

CalBuddy.clearCalorieCache = function () {
localStorage.removeItem("calbuddyCaloriesConsumed");
localStorage.removeItem("calbuddyCaloriesBurned");
localStorage.removeItem("calbuddyActiveNutritionDate");

Object.keys(localStorage).forEach(key => {
if (
key.startsWith("calbuddyCaloriesConsumed_") ||
key.startsWith("calbuddyCaloriesBurned_")
) {
localStorage.removeItem(key);
}
});
};

CalBuddy.changeResetTime = async function ({ hour, minute, ampm }) {
hour = Number(hour);
minute = Number(minute);

if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
throw new Error("Invalid reset time.");
}

const resetTime = { hour, minute, ampm: ampm || "AM" };
localStorage.setItem("calbuddyResetTime", JSON.stringify(resetTime));
CalBuddy.clearCalorieCache();

const user = await CalBuddy.getCurrentUser();

if (user && window.calbuddySupabase) {
const { error } = await window.calbuddySupabase
.from("profiles")
.upsert(
{
id: user.id,
reset_hour: hour,
reset_minute: minute,
reset_ampm: resetTime.ampm,
updated_at: new Date().toISOString()
},
{ onConflict: "id" }
);

if (error) throw error;
}

return resetTime;
};

CalBuddy.logMeal = async function (meal) {
const user = await CalBuddy.getCurrentUser();
const windowInfo = await CalBuddy.getNutritionWindow();
const createdAt = new Date().toISOString();

const mealToSave = {
name: meal.name || "CalBuddy meal",
calories: Number(meal.calories || 0),
category: meal.category || "Meal",
nutrition_date: windowInfo.nutritionDate,
protein_g: Number(meal.protein_g || 0),
carbs_g: Number(meal.carbs_g || 0),
fat_g: Number(meal.fat_g || 0),
serving_size: meal.serving_size || "Added by CalBuddy",
multiplier: Number(meal.multiplier || 1),
is_favorite: Boolean(meal.is_favorite || false),
created_at: createdAt
};

if (!mealToSave.calories || mealToSave.calories <= 0) {
throw new Error("Meal calories are required.");
}

if (user && window.calbuddySupabase) {
const { error } = await window.calbuddySupabase
.from("meals")
.insert({ user_id: user.id, ...mealToSave });

if (error) {
CalBuddy.saveMealLocally(mealToSave);
}
} else {
CalBuddy.saveMealLocally(mealToSave);
}

CalBuddy.clearCalorieCache();
await CalBuddy.getConsumedCalories();

return mealToSave;
};

CalBuddy.saveMealLocally = function (meal) {
const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");

meals.push({
id: Date.now(),
date: meal.nutrition_date,
...meal,
source: "local"
});

localStorage.setItem("calbuddyMeals", JSON.stringify(meals));
};

CalBuddy.getMealsInWindow = async function (offset = 0) {
const user = await CalBuddy.getCurrentUser();
const windowInfo = await CalBuddy.getNutritionWindow(offset);

if (user && window.calbuddySupabase) {
const { data, error } = await window.calbuddySupabase
.from("meals")
.select("*")
.eq("user_id", user.id)
.gte("created_at", windowInfo.start.toISOString())
.lt("created_at", windowInfo.end.toISOString())
.order("created_at", { ascending: true });

if (!error && data) return data.map(meal => ({ ...meal, source: "supabase" }));
}

const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");

return meals
.filter(meal => {
const created = new Date(meal.created_at || meal.createdAt || meal.date || meal.nutrition_date);
return created >= windowInfo.start && created < windowInfo.end;
})
.map(meal => ({ ...meal, source: "local" }));
};

CalBuddy.getConsumedCalories = async function () {
const windowInfo = await CalBuddy.getNutritionWindow();
const meals = await CalBuddy.getMealsInWindow();

const total = meals.reduce((sum, meal) => {
return sum + CalBuddy.safeNumber(meal.calories, 0);
}, 0);

localStorage.setItem(`calbuddyCaloriesConsumed_${windowInfo.dateKey}`, Math.round(total));
localStorage.setItem("calbuddyCaloriesConsumed", Math.round(total));
localStorage.setItem("calbuddyActiveNutritionDate", windowInfo.dateKey);

return Math.round(total);
};

CalBuddy.logCaloriesBurned = async function ({ calories_burned, activity_name = "Activity" }) {
const user = await CalBuddy.getCurrentUser();
const windowInfo = await CalBuddy.getNutritionWindow();

const entry = {
calories_burned: Number(calories_burned || 0),
activity_name,
log_date: windowInfo.nutritionDate,
created_at: new Date().toISOString()
};

if (!entry.calories_burned || entry.calories_burned <= 0) {
throw new Error("Calories burned are required.");
}

if (user && window.calbuddySupabase) {
const { error } = await window.calbuddySupabase
.from("activity_logs")
.insert({ user_id: user.id, ...entry });

if (error) throw error;
}

CalBuddy.clearCalorieCache();
return entry;
};

CalBuddy.getCaloriesBurned = async function () {
const user = await CalBuddy.getCurrentUser();
const windowInfo = await CalBuddy.getNutritionWindow();
const localBurned = CalBuddy.safeNumber(localStorage.getItem(`calbuddyCaloriesBurned_${windowInfo.dateKey}`), 0);

if (!user || !window.calbuddySupabase) {
localStorage.setItem("calbuddyCaloriesBurned", localBurned);
return localBurned;
}

const { data, error } = await window.calbuddySupabase
.from("activity_logs")
.select("calories_burned, created_at")
.eq("user_id", user.id)
.gte("created_at", windowInfo.start.toISOString())
.lt("created_at", windowInfo.end.toISOString());

if (error || !data) {
localStorage.setItem("calbuddyCaloriesBurned", localBurned);
return localBurned;
}

const burned = data.reduce((sum, item) => {
return sum + CalBuddy.safeNumber(item.calories_burned, 0);
}, 0);

localStorage.setItem(`calbuddyCaloriesBurned_${windowInfo.dateKey}`, burned);
localStorage.setItem("calbuddyCaloriesBurned", burned);

return burned;
};

CalBuddy.updateProfile = async function (updates = {}) {
const user = await CalBuddy.getCurrentUser();

Object.entries(updates).forEach(([key, value]) => {
if (value !== undefined && value !== null) {
localStorage.setItem(`calbuddy_${key}`, value);
}
});

if (updates.daily_calorie_goal) {
localStorage.setItem("calbuddyDailyCalorieGoal", updates.daily_calorie_goal);
}

if (updates.current_weight) {
localStorage.setItem("calbuddyCurrentWeight", updates.current_weight);
}

if (updates.goal_weight) {
localStorage.setItem("calbuddyGoalWeight", updates.goal_weight);
}

if (user && window.calbuddySupabase) {
const { error } = await window.calbuddySupabase
.from("profiles")
.upsert(
{
id: user.id,
...updates,
updated_at: new Date().toISOString()
},
{ onConflict: "id" }
);

if (error) throw error;
}

return updates;
};

CalBuddy.logWeight = async function ({ weight, notes = "" }) {
const user = await CalBuddy.getCurrentUser();

if (!weight || Number(weight) <= 0) {
throw new Error("Valid weight is required.");
}

const entry = {
weight: Number(weight),
notes,
log_date: CalBuddy.formatLocalDate(new Date()),
created_at: new Date().toISOString()
};

localStorage.setItem("calbuddyCurrentWeight", entry.weight);
localStorage.setItem("calbuddyLatestWeight", entry.weight);

if (user && window.calbuddySupabase) {
await window.calbuddySupabase
.from("weight_logs")
.insert({ user_id: user.id, ...entry });

await CalBuddy.updateProfile({ current_weight: entry.weight });
}

return entry;
};

CalBuddy.getUserContext = async function () {
const windowInfo = await CalBuddy.getNutritionWindow();
const dailyGoal = CalBuddy.safeNumber(localStorage.getItem("calbuddyDailyCalorieGoal"), 2100);
const consumed = await CalBuddy.getConsumedCalories();
const burned = await CalBuddy.getCaloriesBurned();
const caloriesLeft = Math.max(dailyGoal - consumed + burned, 0);

let goals = {};
try {
goals = JSON.parse(localStorage.getItem("calbuddyGoals") || "{}");
} catch {
goals = {};
}

return {
nutritionWindowStart: windowInfo.start.toISOString(),
nutritionWindowEnd: windowInfo.end.toISOString(),
caloriesConsumed: consumed,
dailyGoal,
caloriesBurned: burned,
caloriesLeft,
currentWeight:
localStorage.getItem("calbuddyCurrentWeight") ||
localStorage.getItem("calbuddyLatestWeight") ||
goals.weight ||
null,
goalWeight:
goals.targetWeight ||
localStorage.getItem("calbuddyGoalWeight") ||
null,
height: goals.height || localStorage.getItem("calbuddy_height") || null,
age: goals.age || localStorage.getItem("calbuddy_age") || null,
gender: goals.gender || localStorage.getItem("calbuddy_gender") || null,
activityLevel: goals.activityLevel || localStorage.getItem("calbuddy_activity_level") || null,
goalType: goals.goalType || localStorage.getItem("calbuddy_goal_type") || null,
coachStyle: localStorage.getItem("calbuddyCoachStyle") || "auto",
literacyLevel: localStorage.getItem("calbuddyLiteracyLevel") || "standard",
humorLevel: localStorage.getItem("calbuddyHumorLevel") || "medium"
};
};

CalBuddy.recommendCalories = function ({
weight,
height,
age,
gender,
activityLevel = "moderate",
goalType = "lose"
}) {
weight = Number(weight);
height = Number(height);
age = Number(age);

if (!weight || !height || !age || !gender) {
return null;
}

const kg = weight * 0.453592;
const cm = height * 2.54;

let bmr;

if (String(gender).toLowerCase().startsWith("f")) {
bmr = 10 * kg + 6.25 * cm - 5 * age - 161;
} else {
bmr = 10 * kg + 6.25 * cm - 5 * age + 5;
}

const activityMap = {
sedentary: 1.2,
light: 1.375,
moderate: 1.55,
active: 1.725,
very_active: 1.9
};

const multiplier = activityMap[activityLevel] || 1.55;
const maintenance = Math.round(bmr * multiplier);

let recommended = maintenance;

if (goalType === "lose") recommended = maintenance - 400;
if (goalType === "gain") recommended = maintenance + 300;
if (goalType === "maintain") recommended = maintenance;

recommended = Math.max(1200, Math.round(recommended / 10) * 10);

return {
bmr: Math.round(bmr),
maintenance,
recommendedCalories: recommended,
goalType,
activityLevel
};
};

CalBuddy.createPendingAction = async function ({ action_type, payload }) {
const user = await CalBuddy.getCurrentUser();

const action = {
action_type,
status: "pending",
payload: payload || {},
created_at: new Date().toISOString()
};

if (user && window.calbuddySupabase) {
const { data, error } = await window.calbuddySupabase
.from("calbuddy_actions")
.insert({ user_id: user.id, ...action })
.select()
.single();

if (error) throw error;
return data;
}

const actions = JSON.parse(localStorage.getItem("calbuddyActions") || "[]");
const localAction = { id: Date.now(), ...action, source: "local" };
actions.push(localAction);
localStorage.setItem("calbuddyActions", JSON.stringify(actions));

return localAction;
};

CalBuddy.executeAction = async function (action) {
const type = action.action_type || action.type;
const payload = action.payload || {};

if (type === "log_meal") return await CalBuddy.logMeal(payload);
if (type === "log_weight") return await CalBuddy.logWeight(payload);
if (type === "log_calories_burned") return await CalBuddy.logCaloriesBurned(payload);
if (type === "change_reset_time") return await CalBuddy.changeResetTime(payload);
if (type === "update_profile" || type === "update_goal_profile") return await CalBuddy.updateProfile(payload);

throw new Error(`Unknown action type: ${type}`);
};

console.log("CalBuddy core loaded.");

