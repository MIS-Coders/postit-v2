//#region src/lib/chat-sources.ts
var MARKER = "\n\n---\n\n**Buka dokumen terkait:**\n\n";
/** Blok markdown berisi link dokumen, atau '' kalau daftarnya kosong. */
function formatSources(sources) {
	if (!sources.length) return "";
	return `${MARKER}${sources.map((source) => {
		const title = source.title.replace(/[\\[\]]/g, "\\$&");
		const pages = source.pages.map(({ page, url }) => `[${page}](${url})`).join(", ");
		return `- [${title}](${source.url})${pages ? `, hal. ${pages}` : ""}`;
	}).join("\n")}\n`;
}
/** Pisahkan teks jawaban dari blok link dokumen di ujungnya. */
function splitSources(content) {
	const at = content.lastIndexOf(MARKER);
	if (at < 0) return {
		text: content,
		sources: []
	};
	const sources = [];
	for (const line of content.slice(at + 34).split("\n")) {
		const links = [...line.matchAll(/\[((?:\\.|[^\]\\])*)\]\(([^)]+)\)/g)];
		if (!links.length) continue;
		const [title, ...pages] = links;
		sources.push({
			title: title[1].replace(/\\(.)/g, "$1"),
			url: title[2],
			pages: pages.map((link) => ({
				page: Number(link[1]),
				url: link[2]
			}))
		});
	}
	return {
		text: content.slice(0, at),
		sources
	};
}

export { formatSources as f, splitSources as s };
//# sourceMappingURL=chat-sources.js-CsV7ABpZ.js.map
