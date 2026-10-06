import { ag as head, ai as escape_html, al as attr_class, am as clsx$1, ad as derived, an as ensure_array_like, ah as attr, ak as stringify, aj as attributes, ap as bind_props } from './server.js-Dzkc9wbJ.js';
import { p as page } from './state.js-CwmYuGot.js';
import { F as File_text_line, A as Arrow_left_line, S as Sparkling_2_line, u as ui } from './file-text-line.js-C2j9SsLW.js';
import { c as cn } from './utils2.js-7mvaj0Jt.js';
import { a as SvelteSet } from './index-server2.js-DgXQ8-9Q.js';

//#region node_modules/remixicon-svelte/dist/icons/arrow-right-s-line.svelte
function Arrow_right_s_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-arrow-right-s-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/folder-3-line.svelte
function Folder_3_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-folder-3-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5ZM4 7V19H20V7H4Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/folder-open-line.svelte
function Folder_open_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-folder-open-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M3 21C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5H20C20.5523 5 21 5.44772 21 6V9H19V7H11.5858L9.58579 5H4V16.998L5.5 11H22.5L20.1894 20.2425C20.0781 20.6877 19.6781 21 19.2192 21H3ZM19.9384 13H7.06155L5.56155 19H18.4384L19.9384 13Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/sop/sop-tree.svelte
function Sop_tree($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { title, departements, docs, selectedId, search } = $$props;
		const opened = new SvelteSet();
		const tree = derived(() => {
			const q = search.trim().toLowerCase();
			return departements.map((dept) => {
				const all = docs.filter((d) => d.departement_id === dept.id).sort((a, b) => a.nama_dokumen.localeCompare(b.nama_dokumen));
				if (!q) return {
					dept,
					docs: all
				};
				if (dept.nama_departement.toLowerCase().includes(q)) return {
					dept,
					docs: all
				};
				const hits = all.filter((d) => d.nama_dokumen.toLowerCase().includes(q) || d.no_dokumen.toLowerCase().includes(q));
				return hits.length ? {
					dept,
					docs: hits
				} : null;
			}).filter((node) => node !== null);
		});
		$$renderer.push(`<aside class="flex min-h-0 w-full shrink-0 flex-col md:w-60 md:border-r lg:w-72"><div class="flex items-baseline justify-between px-5 pt-5 pb-3 md:pt-6"><h2 class="text-sm font-semibold">${escape_html(title)}</h2> <span class="text-xs text-muted-foreground tabular-nums">${escape_html(docs.length)} dokumen</span></div> <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">`);
		if (tree().length === 0) $$renderer.push(`<!--[0--><p class="px-2 py-8 text-center text-sm text-muted-foreground">Tidak ada yang cocok dengan “${escape_html(search)}”.</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <ul class="space-y-0.5"><!--[-->`);
		const each_array = ensure_array_like(tree());
		for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
			let node = each_array[$$index_1];
			const isOpen = !!search.trim() || opened.has(node.dept.id);
			$$renderer.push(`<li><button type="button"${attr("aria-expanded", isOpen)} class="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-muted">`);
			Arrow_right_s_line($$renderer, { class: cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90") });
			$$renderer.push(`<!----> `);
			if (isOpen) {
				$$renderer.push("<!--[0-->");
				Folder_open_line($$renderer, { class: "size-4 shrink-0 text-primary" });
			} else {
				$$renderer.push("<!--[-1-->");
				Folder_3_line($$renderer, { class: "size-4 shrink-0 text-muted-foreground" });
			}
			$$renderer.push(`<!--]--> <span class="min-w-0 flex-1 truncate font-medium"${attr("title", node.dept.nama_departement)}>${escape_html(node.dept.nama_departement)}</span> <span class="text-xs text-muted-foreground tabular-nums">${escape_html(node.docs.length)}</span></button> `);
			if (isOpen) {
				$$renderer.push(`<!--[0--><ul class="mt-0.5 mb-1 ml-[1.1rem] space-y-0.5 border-l pl-2">`);
				const each_array_1 = ensure_array_like(node.docs);
				if (each_array_1.length !== 0) {
					$$renderer.push("<!--[-->");
					for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
						let doc = each_array_1[$$index];
						const active = doc.id === selectedId;
						$$renderer.push(`<li><a${attr("href", `?doc=${stringify(doc.id)}`)} data-sveltekit-noscroll=""${attr("aria-current", active ? "page" : void 0)}${attr_class(clsx$1(cn("flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition", active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground")))}>`);
						File_text_line($$renderer, { class: cn("mt-0.5 size-4 shrink-0", !active && "text-muted-foreground") });
						$$renderer.push(`<!----> <span class="min-w-0"><span${attr_class(clsx$1(cn("block leading-snug", active && "font-medium")))}>${escape_html(doc.nama_dokumen)}</span> <span class="block font-mono text-[11px] text-muted-foreground">${escape_html(doc.no_dokumen)}</span></span></a></li>`);
					}
				} else $$renderer.push(`<!--[!--><li class="px-2 py-1.5 text-xs text-muted-foreground italic">Belum ada dokumen</li>`);
				$$renderer.push(`<!--]--></ul>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></li>`);
		}
		$$renderer.push(`<!--]--></ul></div></aside>`);
	});
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/arrow-left-s-line.svelte
function Arrow_left_s_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-arrow-left-s-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/error-warning-line.svelte
function Error_warning_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-error-warning-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/file-copy-line.svelte
function File_copy_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-file-copy-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/printer-line.svelte
function Printer_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-printer-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M17 2C17.5523 2 18 2.44772 18 3V7H21C21.5523 7 22 7.44772 22 8V18C22 18.5523 21.5523 19 21 19H18V21C18 21.5523 17.5523 22 17 22H7C6.44772 22 6 21.5523 6 21V19H3C2.44772 19 2 18.5523 2 18V8C2 7.44772 2.44772 7 3 7H6V3C6 2.44772 6.44772 2 7 2H17ZM16 17H8V20H16V17ZM20 9H4V17H6V16C6 15.4477 6.44772 15 7 15H17C17.5523 15 18 15.4477 18 16V17H20V9ZM8 10V12H5V10H8ZM16 4H8V7H16V4Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/skip-left-line.svelte
function Skip_left_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-skip-left-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M13.9142 12L18.7071 7.20712L17.2929 5.79291L11.0858 12L17.2929 18.2071L18.7071 16.7929L13.9142 12ZM7 18V6.00001H9V18H7Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/skip-right-line.svelte
function Skip_right_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-skip-right-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M10.0858 12L5.29289 16.7929L6.70711 18.2071L12.9142 12L6.70711 5.79291L5.29289 7.20712L10.0858 12ZM17 6.00002L17 18H15L15 6.00002L17 6.00002Z"></path></svg>`);
}
//#endregion
//#region src/lib/sop.ts
var sopFileUrl = (id) => `/api/sop/${id}/file`;
//#endregion
//#region src/lib/components/sop/pdf-canvas.svelte
function Pdf_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { src, pageNo, numPages = 0, class: className } = $$props;
		$$renderer.push(`<div${attr_class(clsx$1([
			"relative w-full",
			"aspect-[1/1.414]",
			className
		]))}>`);
		$$renderer.push(`<!--[-1--><canvas${attr_class(clsx$1(["block bg-white shadow-md", "invisible"]))} draggable="false"></canvas> `);
		$$renderer.push(`<!--[0--><div class="absolute inset-0 flex items-center justify-center rounded bg-background"><span class="flex items-center gap-2 text-sm text-muted-foreground"><span class="size-1.5 animate-pulse rounded-full bg-primary"></span> Memuat PDF…</span></div>`);
		$$renderer.push(`<!--]-->`);
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { numPages });
	});
}
//#endregion
//#region src/lib/components/sop/sop-viewer.svelte
function Sop_viewer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { typeLabel, doc, departement, canAskAi, canPrint } = $$props;
		let pageNo = 1;
		let numPages = 0;
		let copied = false;
		const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		const expired = derived(() => !!doc?.tgl_expired && doc.tgl_expired < today);
		function fmt(date) {
			if (!date) return "-";
			const [y, m, d] = date.split("-");
			return `${d}/${m}/${y}`;
		}
		const navBtn = "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<section class="flex min-h-0 min-w-0 flex-1 flex-col"><div class="flex items-center gap-3 px-4 pt-4 pb-2 md:gap-4 md:px-10 md:pt-6">`);
			if (doc) {
				$$renderer.push(`<!--[0--><a href="?" class="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs md:hidden" aria-label="Kembali ke daftar dokumen">`);
				Arrow_left_line($$renderer, { class: "size-4" });
				$$renderer.push(`<!----></a>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <nav class="flex min-w-0 flex-1 items-center gap-4 text-sm" aria-label="Breadcrumb"><span${attr_class(clsx$1(cn("shrink-0 text-xl font-normal text-muted-foreground", doc && "hidden md:inline")))}>${escape_html(typeLabel)}</span> `);
			if (departement) $$renderer.push(`<!--[0--><span class="hidden truncate text-foreground/80 lg:block">${escape_html(departement.nama_departement)}</span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (doc) $$renderer.push(`<!--[0--><span class="flex min-w-0 items-center gap-1.5 font-semibold"><span class="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-primary"></span> <span class="truncate">${escape_html(doc.nama_dokumen)}</span></span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></nav> `);
			if (doc) {
				$$renderer.push(`<!--[0--><button type="button" class="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs transition hover:text-foreground"${attr("title", "Salin link dokumen")} aria-label="Salin link dokumen">`);
				File_copy_line($$renderer, { class: cn("size-4", copied) });
				$$renderer.push(`<!----></button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			if (!doc) {
				$$renderer.push(`<!--[0--><div class="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center"><span class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">`);
				File_text_line($$renderer, { class: "size-7" });
				$$renderer.push(`<!----></span> <h2 class="text-lg font-semibold">Pilih dokumen</h2> <p class="max-w-sm text-sm text-muted-foreground">Buka departemen di sebelah kiri, lalu pilih dokumen untuk melihat isinya.</p></div>`);
			} else {
				$$renderer.push(`<!--[-1--><div class="min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-10"><p class="mt-4 text-sm font-semibold text-primary md:mt-8">${escape_html(departement?.nama_departement)}</p> <div class="mt-3 flex flex-wrap items-start justify-between gap-4"><div class="min-w-0"><h1 class="text-xl font-semibold tracking-tight md:text-2xl">${escape_html(doc.nama_dokumen)}</h1> <dl class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground"><div class="flex gap-1.5"><dt>No.</dt><dd class="font-mono text-foreground/80">${escape_html(doc.no_dokumen)}</dd></div> <div class="flex gap-1.5"><dt>Rev.</dt><dd class="font-mono text-foreground/80">${escape_html(doc.no_rev)}</dd></div> <div class="flex gap-1.5"><dt>Berlaku</dt><dd class="text-foreground/80">${escape_html(fmt(doc.tgl_berlaku))}</dd></div></dl></div> `);
				if (canAskAi) {
					$$renderer.push(`<!--[0--><button type="button" class="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10">`);
					Sparkling_2_line($$renderer, { class: "size-4" });
					$$renderer.push(`<!----> Tanya AI</button>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> `);
				if (expired()) {
					$$renderer.push(`<!--[0--><div class="mt-6 rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200" role="note"><div class="flex items-center gap-2 text-lg font-semibold">`);
					Error_warning_line($$renderer, { class: "size-5" });
					$$renderer.push(`<!----> Melewati tanggal berlaku</div> <p class="mt-1 text-sm text-amber-800 dark:text-amber-300/90">Dokumen ini melewati tanggal berlaku (${escape_html(fmt(doc.tgl_expired))}), konfirmasi ke Management
						System sebelum dipakai.</p></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="mt-8 overflow-hidden rounded-2xl border bg-muted/40">`);
				if (doc.has_file) {
					$$renderer.push(`<!--[0--><div class="flex items-center justify-center border-b bg-background/60 px-3 py-2 sm:justify-between md:justify-center lg:justify-between"><div class="flex items-center gap-2 px-2"><span class="text-xs font-medium whitespace-nowrap text-muted-foreground">PDF · ${escape_html(canPrint ? "dapat dicetak" : "lihat saja")}</span> `);
					if (canPrint) {
						$$renderer.push(`<!--[0--><button type="button" class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/10">`);
						Printer_line($$renderer, { class: "size-3.5" });
						$$renderer.push(`<!----> Print</button>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div> <div class="flex items-center gap-0.5"><button type="button"${attr_class(clsx$1(navBtn))} aria-label="Halaman pertama"${attr("disabled", true, true)}>`);
					Skip_left_line($$renderer, { class: "size-4" });
					$$renderer.push(`<!----></button> <button type="button"${attr_class(clsx$1(navBtn))} aria-label="Halaman sebelumnya"${attr("disabled", true, true)}>`);
					Arrow_left_s_line($$renderer, { class: "size-4" });
					$$renderer.push(`<!----></button> <span class="min-w-16 text-center text-sm tabular-nums">${escape_html(pageNo)} / ${escape_html(numPages || "…")}</span> <button type="button"${attr_class(clsx$1(navBtn))} aria-label="Halaman berikutnya"${attr("disabled", pageNo >= numPages, true)}>`);
					Arrow_right_s_line($$renderer, { class: "size-4" });
					$$renderer.push(`<!----></button> <button type="button"${attr_class(clsx$1(navBtn))} aria-label="Halaman terakhir"${attr("disabled", pageNo >= numPages, true)}>`);
					Skip_right_line($$renderer, { class: "size-4" });
					$$renderer.push(`<!----></button></div></div> <div class="relative flex justify-center p-3 select-none md:p-6" role="presentation">`);
					Pdf_canvas($$renderer, {
						src: sopFileUrl(doc.id),
						pageNo,
						class: "max-w-3xl",
						get numPages() {
							return numPages;
						},
						set numPages($$value) {
							numPages = $$value;
							$$settled = false;
						}
					});
					$$renderer.push(`<!----> `);
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
				} else {
					$$renderer.push(`<!--[-1--><div class="flex flex-col items-center gap-2 px-6 py-16 text-center">`);
					File_text_line($$renderer, { class: "size-8 text-muted-foreground" });
					$$renderer.push(`<!----> <p class="font-medium">File PDF belum tersedia</p> <p class="max-w-sm text-sm text-muted-foreground">Dokumen ini tercatat, tapi filenya belum ada di server. Hubungi Management System.</p></div>`);
				}
				$$renderer.push(`<!--]--></div></div>`);
			}
			$$renderer.push(`<!--]--></section>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/lib/components/sop/sop-browser.svelte
function Sop_browser($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { type, departements, docs } = $$props;
		const label = derived(() => type === "READ" ? "SOP/IK" : "SOP Formulir");
		const selectedId = derived(() => Number(page.url.searchParams.get("doc")) || null);
		const initialPage = derived(() => Number(page.url.searchParams.get("page")) || 1);
		const doc = derived(() => docs.find((d) => d.id === selectedId()) ?? null);
		const departement = derived(() => doc() ? departements.find((d) => d.id === doc().departement_id) ?? null : null);
		head("6e78gm", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html(doc() ? `${doc().nama_dokumen} · ` : "")}${escape_html(label())} · PostIt</title>`);
			});
		});
		$$renderer.push(`<div${attr_class(clsx$1(cn("min-h-0", doc() ? "hidden md:flex" : "flex flex-1 md:flex-none")))}>`);
		Sop_tree($$renderer, {
			title: label(),
			departements,
			docs,
			selectedId: doc()?.id ?? null,
			search: ui.search
		});
		$$renderer.push(`<!----></div> <div${attr_class(clsx$1(cn("min-h-0 min-w-0 flex-1", doc() ? "flex" : "hidden md:flex")))}>`);
		Sop_viewer($$renderer, {
			typeLabel: label(),
			doc: doc(),
			departement: departement(),
			initialPage: initialPage(),
			canAskAi: type === "READ",
			canPrint: type === "FORM"
		});
		$$renderer.push(`<!----></div>`);
	});
}

export { Sop_browser as S };
//# sourceMappingURL=sop-browser.js-CIB1VIzM.js.map
