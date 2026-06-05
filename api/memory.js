export default async function handler(req, res) {
return res.status(200).json({
status: "Memory API online",
message: "CalBuddy memory system ready"
});
}
