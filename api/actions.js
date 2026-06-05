export default async function handler(req, res) {
return res.status(200).json({
status: "Actions API online",
message: "CalBuddy action system ready"
});
}
