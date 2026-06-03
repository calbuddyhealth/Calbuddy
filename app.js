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
const authButton = document.getElementById("authButton");

if (!authButton) return;

if (!window.calbuddySupabase) {
console.log("Supabase not loaded");
return;
}

const { data, error } = await window.calbuddySupabase.auth.getSession();

if (error) {
console.log("Session error:", error);
return;
}

if (data.session) {
authButton.textContent = "Logout";

authButton.onclick = async () => {
await window.calbuddySupabase.auth.signOut();
window.location.href = "index.html";
};
} else {
authButton.textContent = "👤 Sign In";

authButton.onclick = () => {
window.location.href = "signin.html";
};
}
});
