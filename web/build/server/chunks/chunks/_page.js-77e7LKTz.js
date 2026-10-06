import { ag as head, ai as escape_html, al as attr_class, am as clsx$1, an as ensure_array_like, ah as attr, aj as attributes, ak as stringify } from './server.js-Dzkc9wbJ.js';

//#region node_modules/remixicon-svelte/dist/icons/file-upload-line.svelte
function File_upload_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-file-upload-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918ZM13 12V16H11V12H8L12 8L16 12H13Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/refresh-line.svelte
function Refresh_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-refresh-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M5.46257 4.43262C7.21556 2.91688 9.5007 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C9.84982 4 7.89777 4.84827 6.46023 6.22842L5.46257 4.43262ZM18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 9.86386 2.66979 7.88416 3.8108 6.25944L7 12H4C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/shield-star-line.svelte
function Shield_star_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-shield-star-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M5 4.60434V13.7889C5 15.1263 5.6684 16.3752 6.7812 17.1171L12 20.5963L17.2188 17.1171C18.3316 16.3752 19 15.1263 19 13.7889V4.60434L12 3.04879L5 4.60434ZM3.78307 2.82598L12 1L20.2169 2.82598C20.6745 2.92766 21 3.33347 21 3.80217V13.7889C21 15.795 19.9974 17.6684 18.3282 18.7812L12 23L5.6718 18.7812C4.00261 17.6684 3 15.795 3 13.7889V3.80217C3 3.33347 3.32553 2.92766 3.78307 2.82598ZM12 13.5L9.06107 15.0451L9.62236 11.7725L7.24472 9.45492L10.5305 8.97746L12 6L13.4695 8.97746L16.7553 9.45492L14.3776 11.7725L14.9389 15.0451L12 13.5Z"></path></svg>`);
}
//#endregion
//#region src/routes/(app)/embed/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data, form } = $$props;
		const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
		head("k6ubzb", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Upload SOP · PostIt</title>`);
			});
		});
		$$renderer.push(`<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8"><div class="mx-auto max-w-4xl"><div class="flex items-start gap-3"><span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">`);
		File_upload_line($$renderer, { class: "size-5" });
		$$renderer.push(`<!----></span> <div><h1 class="text-2xl font-semibold tracking-tight">Upload SOP</h1> <p class="mt-1 text-sm text-muted-foreground">Upload SOP/IK baru untuk diproses otomatis oleh sistem.</p></div></div> `);
		if (form?.error) $$renderer.push(`<!--[0--><p class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">${escape_html(form.error)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <form method="POST" action="?/upload" enctype="multipart/form-data" class="mt-6 rounded-2xl border bg-card p-5 md:p-6"><div class="flex items-center gap-2">`);
		File_upload_line($$renderer, { class: "size-5 text-primary" });
		$$renderer.push(`<!----> <h2 class="font-semibold">Upload SOP/IK baru</h2></div> <p class="mt-1 text-sm text-muted-foreground">PDF maksimal 25 MB. Formulir tidak diproses untuk pencarian AI.</p> <div class="mt-5 grid gap-4 sm:grid-cols-2"><label class="text-sm font-medium">Nama dokumen<input${attr_class(clsx$1(field))} name="namaDokumen" required=""/></label> <label class="text-sm font-medium">Nomor dokumen<input${attr_class(clsx$1(field))} name="noDokumen" required=""/></label> <label class="text-sm font-medium">Departemen <select${attr_class(clsx$1(field))} name="departementId" required="">`);
		$$renderer.option({ value: "" }, ($$renderer) => {
			$$renderer.push(`Pilih departemen`);
		});
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(data.departements);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let department = each_array[$$index];
			$$renderer.option({ value: department.id }, ($$renderer) => {
				$$renderer.push(`${escape_html(department.nama_departement)}`);
			});
		}
		$$renderer.push(`<!--]--></select></label> <label class="text-sm font-medium">Revisi<input${attr_class(clsx$1(field))} name="noRev" type="number" min="0" value="0" required=""/></label> <label class="text-sm font-medium">Tanggal berlaku<input${attr_class(clsx$1(field))} name="tglBerlaku" type="date"/></label> <label class="text-sm font-medium">Tanggal kedaluwarsa<input${attr_class(clsx$1(field))} name="tglExpired" type="date"/></label> <label class="text-sm font-medium sm:col-span-2">File PDF<input${attr_class(`${field} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary`)} name="pdf" type="file" accept="application/pdf" required=""/></label></div> <button class="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" type="submit">`);
		File_upload_line($$renderer, { class: "size-4" });
		$$renderer.push(`<!----> Upload SOP</button></form> `);
		if (data.role === "superadmin") {
			$$renderer.push(`<!--[0--><div class="mt-6 rounded-2xl border bg-card p-5 md:p-6"><div class="flex items-center gap-2">`);
			Shield_star_line($$renderer, { class: "size-5 text-primary" });
			$$renderer.push(`<!----> <h2 class="font-semibold">Proses SOP lama</h2></div> <p class="mt-1 text-sm text-muted-foreground">Jalankan untuk PDF yang sudah tersedia di halaman SOP. Hanya dokumen yang dipilih yang diproses ulang.</p> <div class="mt-4 divide-y rounded-xl border"><!--[-->`);
			const each_array_1 = ensure_array_like(data.docs);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let doc = each_array_1[$$index_1];
				$$renderer.push(`<div class="flex items-center justify-between gap-4 p-3"><div class="min-w-0"><p class="truncate text-sm font-medium">${escape_html(doc.nama_dokumen)}</p><p class="text-xs text-muted-foreground">${escape_html(doc.no_dokumen)}</p></div> <form method="POST" action="?/reembed"><input name="documentId" type="hidden"${attr("value", doc.id)}/> <button${attr("disabled", !doc.has_file, true)} class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" type="submit">`);
				Refresh_line($$renderer, { class: "size-3.5" });
				$$renderer.push(`<!----> Proses ulang</button></form></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></section>`);
	});
}

export { _page as _ };
//# sourceMappingURL=_page.js-77e7LKTz.js.map
