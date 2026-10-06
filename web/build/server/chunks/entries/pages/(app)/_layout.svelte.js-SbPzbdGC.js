import { an as ensure_array_like, ah as attr, al as attr_class, am as clsx$1, ai as escape_html, ak as stringify, ao as html, ad as derived, aj as attributes } from '../../../chunks/server.js-Dzkc9wbJ.js';
import { p as page } from '../../../chunks/state.js-CwmYuGot.js';
import { T as Theme_toggle, C as Chat_new_line, A as Arrow_up_line, F as File_list_3_line } from '../../../chunks/chat-new-line.js-CufkO4C-.js';
import { u as ui, S as Sparkling_2_line, A as Arrow_left_line } from '../../../chunks/file-text-line.js-C2j9SsLW.js';
import { c as cn } from '../../../chunks/utils2.js-7mvaj0Jt.js';
import { marked } from 'marked';
import '../../../chunks/shared.js-CcLTIra1.js';
import '../../../chunks/client.js-CF_OK5QN.js';
import '../../../chunks/routing.js-BH1owdF7.js';
import '../../../chunks/exports.js-DohH99Hj.js';
import '../../../chunks/index-server.js-BPE5KZij.js';
import '../../../chunks/rolldown-runtime.js-pTpnEGsq.js';
import '../../../chunks/internal2.js-BylYz_eZ.js';
import '../../../chunks/legacy-client.js-BYqIYKJq.js';
import '../../../chunks/utils.js-C9mV3RNQ.js';

//#region node_modules/remixicon-svelte/dist/icons/book-open-line.svelte
function Book_open_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-book-open-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M13 21V23H11V21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H9C10.1947 3 11.2671 3.52375 12 4.35418C12.7329 3.52375 13.8053 3 15 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H13ZM20 19V5H15C13.8954 5 13 5.89543 13 7V19H20ZM11 19V7C11 5.89543 10.1046 5 9 5H4V19H11Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/building-2-line.svelte
function Building_2_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-building-2-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M3 19V5.70046C3 5.27995 3.26307 4.90437 3.65826 4.76067L13.3291 1.24398C13.5886 1.14961 13.8755 1.28349 13.9699 1.54301C13.9898 1.59778 14 1.65561 14 1.71388V6.6667L20.3162 8.77211C20.7246 8.90822 21 9.29036 21 9.72079V19H23V21H1V19H3ZM5 19H12V3.85543L5 6.40089V19ZM19 19V10.4416L14 8.77488V19H19Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/file-edit-line.svelte
function File_edit_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-file-edit-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M21 6.75736L19 8.75736V4H10V9H5V20H19V17.2426L21 15.2426V21.0082C21 21.556 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5501 3 20.9932V8L9.00319 2H19.9978C20.5513 2 21 2.45531 21 2.9918V6.75736ZM21.7782 8.80761L23.1924 10.2218L15.4142 18L13.9979 17.9979L14 16.5858L21.7782 8.80761Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/logout-box-r-line.svelte
function Logout_box_r_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-logout-box-r-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V6H18V4H6V20H18V18H20V21C20 21.5523 19.5523 22 19 22H5ZM18 16V13H11V11H18V8L23 12L18 16Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/team-line.svelte
function Team_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-team-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M12 11C14.7614 11 17 13.2386 17 16V22H15V16C15 14.4023 13.7511 13.0963 12.1763 13.0051L12 13C10.4023 13 9.09634 14.2489 9.00509 15.8237L9 16V22H7V16C7 13.2386 9.23858 11 12 11ZM5.5 14C5.77885 14 6.05009 14.0326 6.3101 14.0942C6.14202 14.594 6.03873 15.122 6.00896 15.6693L6 16L6.0007 16.0856C5.88757 16.0456 5.76821 16.0187 5.64446 16.0069L5.5 16C4.7203 16 4.07955 16.5949 4.00687 17.3555L4 17.5V22H2V17.5C2 15.567 3.567 14 5.5 14ZM18.5 14C20.433 14 22 15.567 22 17.5V22H20V17.5C20 16.7203 19.4051 16.0796 18.6445 16.0069L18.5 16C18.3248 16 18.1566 16.03 18.0003 16.0852L18 16C18 15.3343 17.8916 14.694 17.6915 14.0956C17.9499 14.0326 18.2211 14 18.5 14ZM5.5 8C6.88071 8 8 9.11929 8 10.5C8 11.8807 6.88071 13 5.5 13C4.11929 13 3 11.8807 3 10.5C3 9.11929 4.11929 8 5.5 8ZM18.5 8C19.8807 8 21 9.11929 21 10.5C21 11.8807 19.8807 13 18.5 13C17.1193 13 16 11.8807 16 10.5C16 9.11929 17.1193 8 18.5 8ZM5.5 10C5.22386 10 5 10.2239 5 10.5C5 10.7761 5.22386 11 5.5 11C5.77614 11 6 10.7761 6 10.5C6 10.2239 5.77614 10 5.5 10ZM18.5 10C18.2239 10 18 10.2239 18 10.5C18 10.7761 18.2239 11 18.5 11C18.7761 11 19 10.7761 19 10.5C19 10.2239 18.7761 10 18.5 10ZM12 2C14.2091 2 16 3.79086 16 6C16 8.20914 14.2091 10 12 10C9.79086 10 8 8.20914 8 6C8 3.79086 9.79086 2 12 2ZM12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8C13.1046 8 14 7.10457 14 6C14 4.89543 13.1046 4 12 4Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/app/app-rail.svelte
function App_rail($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const groups = [[{
			label: "SOP/IK",
			icon: Book_open_line,
			href: "/sop"
		}, {
			label: "SOP Formulir",
			icon: File_list_3_line,
			href: "/formulir"
		}], [
			{
				label: "Modified Documents",
				icon: File_edit_line
			},
			{
				label: "Kelola User",
				icon: Team_line
			},
			{
				label: "Departemen",
				icon: Building_2_line
			}
		]];
		const base = "flex size-10 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs transition";
		$$renderer.push(`<nav class="hidden w-16 shrink-0 flex-col items-center gap-3 pt-1 pb-4 md:flex" aria-label="Menu utama"><!--[-->`);
		const each_array = ensure_array_like(groups);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let group = each_array[i];
			if (i > 0) $$renderer.push(`<!--[0--><span class="h-px w-8 bg-border"></span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <!--[-->`);
			const each_array_1 = ensure_array_like(group);
			for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
				let item = each_array_1[$$index];
				const Icon = item.icon;
				if (item.href) {
					$$renderer.push("<!--[0-->");
					const active = page.url.pathname.startsWith(item.href);
					$$renderer.push(`<a${attr("href", item.href)}${attr("title", item.label)}${attr("aria-label", item.label)}${attr("aria-current", active ? "page" : void 0)}${attr_class(clsx$1(cn(base, active ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30" : "hover:border-primary/30 hover:text-primary")))}>`);
					if (Icon) {
						$$renderer.push("<!--[-->");
						Icon($$renderer, { class: "size-5" });
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
					$$renderer.push(`</a>`);
				} else {
					$$renderer.push(`<!--[-1--><button type="button" disabled=""${attr("title", `${stringify(item.label)} (segera)`)}${attr("aria-label", `${stringify(item.label)} (segera)`)}${attr_class(clsx$1(cn(base, "cursor-not-allowed opacity-60")))}>`);
					if (Icon) {
						$$renderer.push("<!--[-->");
						Icon($$renderer, { class: "size-5" });
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
					$$renderer.push(`</button>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--> <button type="button" title="Keluar" aria-label="Keluar"${attr_class(clsx$1(cn(base, "mt-auto hover:border-destructive/30 hover:text-destructive")))}>`);
		Logout_box_r_line($$renderer, { class: "size-5" });
		$$renderer.push(`<!----></button></nav>`);
	});
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/customer-service-2-line.svelte
function Customer_service_2_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-customer-service-2-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M19.9381 8H21C22.1046 8 23 8.89543 23 10V14C23 15.1046 22.1046 16 21 16H19.9381C19.446 19.9463 16.0796 23 12 23V21C15.3137 21 18 18.3137 18 15V9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9V16H3C1.89543 16 1 15.1046 1 14V10C1 8.89543 1.89543 8 3 8H4.06189C4.55399 4.05369 7.92038 1 12 1C16.0796 1 19.446 4.05369 19.9381 8ZM3 10V14H4V10H3ZM20 10V14H21V10H20ZM7.75944 15.7849L8.81958 14.0887C9.74161 14.6662 10.8318 15 12 15C13.1682 15 14.2584 14.6662 15.1804 14.0887L16.2406 15.7849C15.0112 16.5549 13.5576 17 12 17C10.4424 17 8.98882 16.5549 7.75944 15.7849Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/search-line.svelte
function Search_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-search-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/app/app-topbar.svelte
function App_topbar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const baseTabs = [
			{
				href: "/sop",
				label: "SOP/IK"
			},
			{
				href: "/formulir",
				label: "SOP Formulir"
			},
			{
				href: "/upload",
				label: "Upload SOP"
			}
		];
		let { user, role } = $$props;
		let tabs = derived(() => role === "superadmin" ? [...baseTabs, {
			href: "/users",
			label: "Pengguna"
		}] : baseTabs);
		$$renderer.push(`<header class="flex h-16 shrink-0 items-center gap-3 px-3 md:px-4"><div class="flex items-center gap-3"><button type="button" class="hidden size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground md:flex" aria-label="Kembali">`);
		Arrow_left_line($$renderer, { class: "size-5" });
		$$renderer.push(`<!----></button> <span class="hidden h-6 w-px bg-border md:block"></span> <a href="/sop" class="flex items-center gap-2"><span class="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/30">P</span> <span class="text-lg font-semibold tracking-tight">PostIt</span></a> <span class="hidden rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-primary sm:inline-block">SOP PORTAL</span></div> <nav class="mx-auto hidden items-center gap-1 lg:flex" aria-label="Jenis dokumen"><!--[-->`);
		const each_array = ensure_array_like(tabs());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let tab = each_array[$$index];
			const active = page.url.pathname.startsWith(tab.href);
			$$renderer.push(`<a${attr("href", tab.href)}${attr("aria-current", active ? "page" : void 0)}${attr_class(clsx$1(cn("rounded-full px-4 py-1.5 text-sm font-medium transition", active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "text-foreground/80 hover:text-foreground")))}>${escape_html(tab.label)}</a>`);
		}
		$$renderer.push(`<!--]--></nav> <div class="ml-auto flex items-center gap-2 lg:ml-0"><label class="flex h-9 w-44 items-center gap-2 rounded-full border bg-background px-3 text-sm shadow-xs transition focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-primary/15 md:w-72">`);
		Search_line($$renderer, { class: "size-4 shrink-0 text-muted-foreground" });
		$$renderer.push(`<!----> <input${attr("value", ui.search)} type="search" placeholder="Cari dokumen…" class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:ring-0"/> <span class="hidden items-center gap-1 md:flex"><kbd class="rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">⌘</kbd> <kbd class="rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">K</kbd></span></label> `);
		Theme_toggle($$renderer);
		$$renderer.push(`<!----> `);
		if (user) $$renderer.push(`<!--[0--><form method="POST" action="/logout" class="hidden md:block"><button type="submit" class="max-w-32 truncate text-sm font-medium text-muted-foreground transition hover:text-foreground"${attr("title", user.email)}>${escape_html(user.name)}</button></form>`);
		else $$renderer.push(`<!--[-1--><a href="/login" class="hidden rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted md:block">Masuk</a>`);
		$$renderer.push(`<!--]--> <span class="hidden h-6 w-px bg-border md:block"></span> <button type="button" class="hidden size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground md:flex" aria-label="Bantuan" title="Bantuan">`);
		Customer_service_2_line($$renderer, { class: "size-5" });
		$$renderer.push(`<!----></button></div></header>`);
	});
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/close-line.svelte
function Close_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-close-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/expand-diagonal-line.svelte
function Expand_diagonal_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-expand-diagonal-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M17.5858 5H14V3H21V10H19V6.41421L14.7071 10.7071L13.2929 9.29289L17.5858 5ZM3 14H5V17.5858L9.29289 13.2929L10.7071 14.7071L6.41421 19H10V21H3V14Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/sparkling-2-fill.svelte
function Sparkling_2_fill($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-sparkling-2-fill ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M17.0007 1.20825 18.3195 3.68108 20.7923 4.99992 18.3195 6.31876 17.0007 8.79159 15.6818 6.31876 13.209 4.99992 15.6818 3.68108 17.0007 1.20825ZM8.00065 4.33325 10.6673 9.33325 15.6673 11.9999 10.6673 14.6666 8.00065 19.6666 5.33398 14.6666.333984 11.9999 5.33398 9.33325 8.00065 4.33325ZM19.6673 16.3333 18.0007 13.2083 16.334 16.3333 13.209 17.9999 16.334 19.6666 18.0007 22.7916 19.6673 19.6666 22.7923 17.9999 19.6673 16.3333Z"></path></svg>`);
}
//#endregion
//#region src/lib/mock/sop.ts
var currentUser = {
	nama: "Budi Santoso"};
//#endregion
//#region src/lib/components/chat/ask-ai-panel.svelte
function Ask_ai_panel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { class: className } = $$props;
		let messages = [];
		let query = "";
		let isLoading = false;
		const firstName = currentUser.nama.split(" ")[0];
		const suggestions = derived(() => [
			"Bagaimana cara mengajukan cuti?",
			"Apa syarat pengajuan uang muka kerja?",
			"Siapa yang menyetujui pengadaan barang?"
		]);
		const iconBtn = "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground";
		$$renderer.push(`<aside${attr_class(clsx$1(cn("fixed inset-3 z-40 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-primary/30 bg-background shadow-2xl shadow-primary/10", "xl:static xl:inset-auto xl:z-auto xl:my-5 xl:mr-5 xl:shrink-0 xl:shadow-lg short:xl:my-3 short:xl:mr-3", "xl:w-[380px]", className)))} aria-label="Tanya AI"><div class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-primary/[0.03] to-primary/10"></div> <div class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-60 [mask-image:linear-gradient(to_top,black,transparent)]" style="background-image: linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px); background-size: 72px 72px;"></div> <header class="relative flex items-center gap-2 px-5 py-4 short:py-2.5">`);
		Sparkling_2_line($$renderer, { class: "size-5 text-primary" });
		$$renderer.push(`<!----> <h2 class="text-lg font-semibold text-primary">Tanya AI</h2> <div class="ml-auto flex items-center gap-0.5"><button type="button"${attr_class(clsx$1(iconBtn))} aria-label="Mulai percakapan baru" title="Mulai percakapan baru">`);
		Chat_new_line($$renderer, { class: "size-4" });
		$$renderer.push(`<!----></button> <button type="button"${attr_class(clsx$1(cn(iconBtn, "hidden xl:flex")))}${attr("aria-label", "Perbesar panel")}>`);
		{
			$$renderer.push("<!--[-1-->");
			Expand_diagonal_line($$renderer, { class: "size-4" });
		}
		$$renderer.push(`<!--]--></button> <button type="button"${attr_class(clsx$1(iconBtn))} aria-label="Tutup panel">`);
		Close_line($$renderer, { class: "size-5" });
		$$renderer.push(`<!----></button></div></header> <div class="relative min-h-0 flex-1 overflow-y-auto px-5">`);
		if (messages.length === 0) {
			$$renderer.push(`<!--[0--><div class="flex min-h-full flex-col items-center justify-center py-10 text-center short:py-3"><span class="flex size-16 shrink-0 items-center justify-center rounded-full short:size-11 bg-linear-to-br from-emerald-400 to-primary text-primary-foreground shadow-[0_10px_30px_-6px] shadow-primary/60 ring-4 ring-primary/10">`);
			Sparkling_2_fill($$renderer, { class: "size-7 short:size-5" });
			$$renderer.push(`<!----></span> <p class="mt-6 text-2xl font-semibold text-primary short:mt-3 short:text-xl">Hai, ${escape_html(firstName)}</p> <p class="mt-1 text-lg font-medium short:text-base">Ada yang bisa dibantu soal SOP?</p> <p class="mt-14 text-sm text-muted-foreground short:mt-5">Saran:</p> <div class="mt-3 flex flex-col items-center gap-2 short:mt-2 short:gap-1.5"><!--[-->`);
			const each_array = ensure_array_like(suggestions());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let s = each_array[$$index];
				$$renderer.push(`<button type="button" class="rounded-full border bg-background px-3 py-1.5 text-sm shadow-xs transition short:py-1 hover:border-primary/40 hover:text-primary">${escape_html(s)}</button>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		} else {
			$$renderer.push(`<!--[-1--><div class="flex flex-col gap-5 py-4"><!--[-->`);
			const each_array_1 = ensure_array_like(messages);
			for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
				let msg = each_array_1[i];
				if (msg.role === "user") $$renderer.push(`<!--[0--><div class="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">${escape_html(msg.content)}</div>`);
				else {
					$$renderer.push(`<!--[-1--><div class="flex gap-2.5"><span class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">`);
					Sparkling_2_fill($$renderer, { class: "size-3.5" });
					$$renderer.push(`<!----></span> `);
					if (msg.content) $$renderer.push(`<!--[0--><div class="prose prose-sm min-w-0 max-w-none text-sm dark:prose-invert prose-a:text-primary">${html(marked.parse(msg.content))}</div>`);
					else $$renderer.push(`<!--[-1--><p class="flex items-center gap-2 pt-1 text-sm text-muted-foreground"><span class="size-1.5 animate-pulse rounded-full bg-primary"></span> Mencari di SOP…</p>`);
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div> <footer class="relative space-y-2 p-4 pt-2 short:p-3 short:pt-1">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <form class="flex items-center gap-2 rounded-full border border-primary/40 bg-background py-1.5 pr-1.5 pl-4 shadow-sm transition focus-within:ring-3 focus-within:ring-primary/15"><input${attr("value", query)} placeholder="Tanyakan sesuatu tentang SOP…"${attr("disabled", isLoading, true)} class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:ring-0"/> <button type="submit"${attr("disabled", !query.trim(), true)} aria-label="Kirim" class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/85 disabled:opacity-40">`);
		Arrow_up_line($$renderer, { class: "size-4" });
		$$renderer.push(`<!----></button></form> <p class="text-center text-[11px] text-muted-foreground short:hidden">Jawaban AI bisa keliru. Selalu cek dokumen sumbernya.</p></footer></aside>`);
	});
}
//#endregion
//#region src/routes/(app)/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, data } = $$props;
		const mobileTabs = [{
			href: "/sop",
			label: "SOP/IK",
			icon: Book_open_line
		}, {
			href: "/formulir",
			label: "Formulir",
			icon: File_list_3_line
		}];
		const tabClass = "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium";
		$$renderer.push(`<div class="flex h-dvh bg-muted font-sans md:p-4"><div class="flex min-w-0 flex-1 flex-col bg-sidebar md:rounded-[1.75rem] md:border md:shadow-[0_0_0_6px] md:shadow-primary/5">`);
		App_topbar($$renderer, {
			user: data.user,
			role: data.role
		});
		$$renderer.push(`<!----> <div class="flex min-h-0 flex-1 gap-2 md:pr-4 md:pb-4">`);
		App_rail($$renderer);
		$$renderer.push(`<!----> <main class="flex min-h-0 min-w-0 flex-1 overflow-hidden border-t bg-card md:rounded-2xl md:border">`);
		children($$renderer);
		$$renderer.push(`<!----> `);
		{
			$$renderer.push("<!--[0-->");
			Ask_ai_panel($$renderer, { class: "hidden xl:flex"  });
		}
		$$renderer.push(`<!--]--></main></div> <nav class="flex h-16 shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navigasi"><!--[-->`);
		const each_array = ensure_array_like(mobileTabs);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let tab = each_array[$$index];
			const active = page.url.pathname.startsWith(tab.href);
			const Icon = tab.icon;
			$$renderer.push(`<a${attr("href", tab.href)}${attr("aria-current", active ? "page" : void 0)}${attr_class(clsx$1(cn(tabClass, active ? "text-primary" : "text-muted-foreground")))}><span${attr_class(clsx$1(cn("flex h-7 w-12 items-center justify-center rounded-full", active && "bg-primary/10")))}>`);
			if (Icon) {
				$$renderer.push("<!--[-->");
				Icon($$renderer, { class: "size-5" });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(`</span> ${escape_html(tab.label)}</a>`);
		}
		$$renderer.push(`<!--]--> <button type="button"${attr_class(clsx$1(cn(tabClass, "text-muted-foreground")))}><span${attr_class(clsx$1(cn("flex h-7 w-12 items-center justify-center rounded-full", ui.askAi.open === true)))}>`);
		Sparkling_2_line($$renderer, { class: "size-5" });
		$$renderer.push(`<!----></span> Tanya AI</button></nav></div></div> `);
		{
			$$renderer.push(`<!--[0--><button type="button"${attr_class(clsx$1(cn("fixed right-6 bottom-6 z-40 hidden font-sans md:flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90", "xl:hidden")))}>`);
			Sparkling_2_line($$renderer, { class: "size-4" });
			$$renderer.push(`<!----> Tanya AI</button>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte.js-SbPzbdGC.js.map
