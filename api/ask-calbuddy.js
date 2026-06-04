export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({
error: "Method not allowed"
});
}

try {
const { message } = req.body;

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
content:
"You are CalBuddy, a friendly AI wellness and nutrition coach built with guidance from a nurse. You help users with nutrition, fitness, weight loss, healthy habits, stress management, and general life questions. Be supportive, practical, conversational, and occasionally humorous. Never shame users."
},
{
role: "user",
content: message
}
],
temperature: 0.8
})
}
);

const data = await response.json();

return res.status(200).json({
reply: data.choices[0].message.content
});

} catch (error) {
console.error(error);

return res.status(500).json({
error: "Something went wrong."
});
}
}
