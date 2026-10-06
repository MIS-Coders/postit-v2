import { b as private_env } from './shared-server.js-9-2j12mp.js';

//#region src/lib/server/embed.ts
var apiUrl = () => (private_env.EMBED_API_URL || private_env.PUBLIC_API_URL || "http://localhost:3018").replace(/\/$/, "");
async function callApi(path, init) {
	const response = await fetch(`${apiUrl()}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${private_env.APP_SECRET_TOKEN}`,
			...init?.headers
		}
	});
	const body = await response.json().catch(() => null);
	if (!response.ok) throw new Error(body && "error" in body ? body.error || "Layanan embed gagal." : "Layanan embed gagal.");
	return body;
}
function startEmbed(input) {
	return callApi("/api/embed/jobs", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input)
	});
}
function getEmbedJob(id) {
	return callApi(`/api/embed/jobs/${encodeURIComponent(id)}`);
}

export { getEmbedJob as g, startEmbed as s };
//# sourceMappingURL=embed.js-Ccnt-Gqu.js.map
