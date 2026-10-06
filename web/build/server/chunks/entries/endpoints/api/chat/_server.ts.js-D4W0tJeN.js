import { b as private_env, p as public_env } from '../../../../chunks/shared-server.js-9-2j12mp.js';
import { f as formatSources } from '../../../../chunks/chat-sources.js-CsV7ABpZ.js';
import { l as listSop } from '../../../../chunks/sop.js-BBrYzUff.js';
import { v as error } from '../../../../chunks/utils.js-C9mV3RNQ.js';
import 'node:fs';
import 'node:fs/promises';
import 'node:path';
import '../../../../chunks/shared.js-CcLTIra1.js';

//#region src/lib/api.ts
/**
* Base URL Python API (RAG/SOP).
* Produksi: https://postit-ai.mahkotagroup.com (via PUBLIC_API_URL di web/.env).
* Fallback hanya untuk dev lokal.
*/
var apiBase = public_env.PUBLIC_API_URL || public_env.DEV_PORT;
if (!apiBase) throw new Error("PUBLIC_API_URL or DEV_PORT must be defined");
/** Endpoint streaming chat RAG. */
var CHAT_ENDPOINT = `${apiBase.replace(/\/+$/, "")}/api/chat`;
//#endregion
//#region src/lib/server/chat-sources.ts
var normalize = (text) => text.toLowerCase().replace(/\.pdf$/, "").replace(/[^a-z0-9]+/g, " ").trim();
/**
* Cari dokumen SOP untuk satu sumber. Embedding baru membawa sop_doc_id; embedding lama
* (batch_embed.py) hanya punya path "Departemen/Nama Dokumen.pdf", jadi dicocokkan lewat nama.
*/
function findDoc(source) {
	const { departements, docs } = listSop("READ");
	const id = Number(source.sop_doc_id);
	if (id) return docs.find((doc) => doc.id === id) ?? null;
	const name = normalize(source.source.split("/").pop() ?? "");
	let matches = docs.filter((doc) => normalize(doc.nama_dokumen) === name);
	if (matches.length > 1) {
		const department = normalize(source.department ?? "");
		const ids = departements.filter((d) => normalize(d.nama_departement) === department).map((d) => d.id);
		matches = matches.filter((doc) => ids.includes(doc.departement_id));
	}
	return matches.length === 1 ? matches[0] : null;
}
/** Blok markdown berisi link ke dokumen sumber, atau '' kalau tidak ada yang bisa ditautkan. */
function sourceLinksMarkdown(header) {
	if (!header) return "";
	const links = [];
	try {
		for (const source of JSON.parse(header)) {
			const doc = findDoc(source);
			if (!doc) continue;
			const url = (page) => `/sop?doc=${doc.id}&page=${page}`;
			links.push({
				title: doc.nama_dokumen,
				url: url(source.pages[0] ?? 1),
				pages: source.pages.map((page) => ({
					page,
					url: url(page)
				}))
			});
		}
	} catch {
		return "";
	}
	return formatSources(links);
}
//#endregion
//#region src/routes/api/chat/+server.ts
var POST = async ({ request }) => {
	try {
		const body = await request.json();
		const SECRET_TOKEN = private_env.APP_SECRET_TOKEN || (() => {
			throw error(500, "APP_SECRET_TOKEN tidak ditemukan");
		})();
		const flaskResponse = await fetch(CHAT_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${SECRET_TOKEN}`
			},
			body: JSON.stringify(body)
		});
		if (!flaskResponse.ok) {
			const errText = await flaskResponse.text();
			throw error(flaskResponse.status, `Gagal terhubung ke Backend Flask: ${errText}`);
		}
		const links = sourceLinksMarkdown(flaskResponse.headers.get("x-chat-sources"));
		const stream = links && flaskResponse.body ? flaskResponse.body.pipeThrough(new TransformStream({ flush: (controller) => controller.enqueue(new TextEncoder().encode(links)) })) : flaskResponse.body;
		return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
	} catch (err) {
		throw error(500, err.message || "Internal Server Error");
	}
};

export { POST };
//# sourceMappingURL=_server.ts.js-D4W0tJeN.js.map
