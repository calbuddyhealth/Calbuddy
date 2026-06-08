export default async function handler(req, res) {
try {
if (req.method !== "POST") {
return res.status(405).json({
error: "Method not allowed"
});
}

const {
owner_access,
command
} = req.body || {};

if (!owner_access) {
return res.status(403).json({
error: "Owner authorization required"
});
}

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPO;

if (!token || !repo) {
return res.status(500).json({
error: "GitHub environment variables missing"
});
}

return res.status(200).json({
success: true,
message: "Ari GitHub editing endpoint ready",
repository: repo,
command
});

} catch (err) {
console.error(err);

return res.status(500).json({
error: err.message
});
}
}
