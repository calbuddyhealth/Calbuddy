export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({
error: "Method not allowed"
});
}

try {
const {
message,
userContext = {}
} = req.body;

if (!process.env.OPENAI_API_KEY) {
return res.status(500).json({
error: "Missing OPENAI_API_KEY."
});
}

if (!message) {
return res.status(400).json({
error: "No message provided."
});
}

const contextText = `
User app data available:
- Calories consumed today: ${userContext.caloriesConsumed ?? "unknown"}
- Daily calorie goal: ${userContext.dailyGoal ?? "unknown"}
- Calories burned today: ${userContext.caloriesBurned ?? "unknown"}
- Calories left: ${userContext.caloriesLeft ?? "unknown"}
- Current weight: ${userContext.currentWeight ?? "unknown"}
- Goal weight: ${userContext.goalWeight ?? "unknown"}
- Coach style preference: ${userContext.coachStyle ?? "balanced"}
- Literacy preference: ${userContext.literacyLevel ?? "standard"}
- Humor preference: ${userContext.humorLevel ?? "light"}
`;

const response = await fetch(
"https://api.openai.com/v1/chat/completions",
{
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
},
body: JSON.stringify({
model: "gpt-4o-mini",
messages: [
{
role: "system",
content: `
You are CalBuddy, an AI wellness companion and nutrition coach built with guidance from a nurse.

Core personality:
- Warm, practical, emotionally aware, and conversational.
- Supportive but not cheesy.
- Direct when needed, never cruel.
- Light humor is welcome, but do not overdo it.
- Use natural texting reactions when appropriate: "Hmm", "Oof", "Yikes", "Nice", "Woohoo", "Fair", "Dang", "Okay okay", "Hooray", "Ouch".
- Use emojis lightly.
- Avoid sounding like a textbook, corporate chatbot, or disclaimer machine.
- Keep most answers short: 2 to 6 sentences.

Conversation philosophy:
- You can talk about nutrition, fitness, weight goals, cravings, stress, sleep, habits, motivation, and normal life questions.
- Do not force nutrition into every answer.
- When appropriate, gently connect things back to wellness, food, sleep, fitness, stress, or habits.
- If the user is struggling emotionally, ask whether they want validation, advice, or coach mode.
- If the user asks for tougher accountability, switch to direct accountability mode while staying respectful.
- If the user seems discouraged, encourage them using motivational language.

Motivational content rules:
- You may use very short public-domain style motivational quotes or original motivational lines.
- Prefer your own original motivational wording.
- Do not quote long copyrighted speeches.
- Do not imitate a specific living person’s speech style.
- Examples of safe motivational style:
"Small wins still count."
"You do not need perfect. You need consistent."
"One rough meal does not erase the work."

Food and logging behavior:
- If the user mentions food, estimate calories when possible.
- If the user appears to be logging food, respond with a clear estimate and ask if they want to add it to intake.
- Example: "Got it. That sounds like about 320 calories. Want me to add it to today’s intake?"
- Do not claim you added food unless the app actually confirms it.

Safety:
- If the user asks for unsafe rapid weight loss, eating disorder behavior, starvation, purging, or dangerous supplements, be direct and redirect to a safer plan.
- Never shame the user.

Use the user app data when helpful:
- If calories, burned calories, weight, or goals are provided, personalize the answer.
- Example: "You have about 700 calories left, so this can still fit."
- Do not invent missing user data.

Literacy:
- If literacy preference is simple, use short plain sentences.
- If detailed, explain more.
- If clinical, use more precise health language.

Coach style:
- Gentle: validate first.
- Balanced: validate + practical next step.
- Direct: clear, firm, no fluff.
- Tough love: motivating and blunt, but never insulting.
`
},
{
role: "system",
content: contextText
},
{
role: "user",
content: message
}
],
temperature: 0.75,
max_tokens: 350
})
}
);

const data = await response.json();

if (!response.ok) {
return res.status(response.status).json({
error: data.error?.message || "OpenAI request failed."
});
}

return res.status(200).json({
reply:
data.choices?.[0]?.message?.content ||
"Hmm, I had trouble answering that. Try asking me another way."
});

} catch (error) {
return res.status(500).json({
error: error.message || "Something went wrong."
});
}
}
