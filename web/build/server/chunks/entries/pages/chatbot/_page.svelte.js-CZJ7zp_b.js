import { ag as head, ai as escape_html, an as ensure_array_like, ao as html, au as attr_style, ah as attr, al as attr_class, am as clsx$1, av as element, aj as attributes, ak as stringify } from '../../../chunks/server.js-Dzkc9wbJ.js';
import { s as splitSources } from '../../../chunks/chat-sources.js-CsV7ABpZ.js';
import { C as Chat_new_line, T as Theme_toggle, A as Arrow_up_line, F as File_list_3_line } from '../../../chunks/chat-new-line.js-CufkO4C-.js';
import { c as cn } from '../../../chunks/utils2.js-7mvaj0Jt.js';
import { marked } from 'marked';
import '../../../chunks/shared.js-CcLTIra1.js';

//#region node_modules/remixicon-svelte/dist/icons/arrow-right-up-line.svelte
function Arrow_right_up_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-arrow-right-up-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/calendar-check-line.svelte
function Calendar_check_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-calendar-check-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M9 1V3H15V1H17V3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9ZM20 10H4V19H20V10ZM15.0355 11.136L16.4497 12.5503L11.5 17.5L7.96447 13.9645L9.37868 12.5503L11.5 14.6716L15.0355 11.136ZM7 5H4V8H20V5H17V6H15V5H9V6H7V5Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/file-pdf-2-line.svelte
function File_pdf_2_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-file-pdf-2-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M5 4H15V8H19V20H5V4ZM3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 20.9925L20.9997 7L16 2H3.9985ZM10.4999 7.5C10.4999 9.07749 10.0442 10.9373 9.27493 12.6534C8.50287 14.3757 7.46143 15.8502 6.37524 16.7191L7.55464 18.3321C10.4821 16.3804 13.7233 15.0421 16.8585 15.49L17.3162 13.5513C14.6435 12.6604 12.4999 9.98994 12.4999 7.5H10.4999ZM11.0999 13.4716C11.3673 12.8752 11.6042 12.2563 11.8037 11.6285C12.2753 12.3531 12.8553 13.0182 13.5101 13.5953C12.5283 13.7711 11.5665 14.0596 10.6352 14.4276C10.7999 14.1143 10.9551 13.7948 11.0999 13.4716Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/links-line.svelte
function Links_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-links-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M13.0607 8.11097L14.4749 9.52518C17.2086 12.2589 17.2086 16.691 14.4749 19.4247L14.1214 19.7782C11.3877 22.5119 6.95555 22.5119 4.22188 19.7782C1.48821 17.0446 1.48821 12.6124 4.22188 9.87874L5.6361 11.293C3.68348 13.2456 3.68348 16.4114 5.6361 18.364C7.58872 20.3166 10.7545 20.3166 12.7072 18.364L13.0607 18.0105C15.0133 16.0578 15.0133 12.892 13.0607 10.9394L11.6465 9.52518L13.0607 8.11097ZM19.7782 14.1214L18.364 12.7072C20.3166 10.7545 20.3166 7.58872 18.364 5.6361C16.4114 3.68348 13.2456 3.68348 11.293 5.6361L10.9394 5.98965C8.98678 7.94227 8.98678 11.1081 10.9394 13.0607L12.3536 14.4749L10.9394 15.8891L9.52518 14.4749C6.79151 11.7413 6.79151 7.30911 9.52518 4.57544L9.87874 4.22188C12.6124 1.48821 17.0446 1.48821 19.7782 4.22188C22.5119 6.95555 22.5119 11.3877 19.7782 14.1214Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/money-dollar-circle-line.svelte
function Money_dollar_circle_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-money-dollar-circle-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M12.0049 22.0027C6.48204 22.0027 2.00488 17.5256 2.00488 12.0027C2.00488 6.4799 6.48204 2.00275 12.0049 2.00275C17.5277 2.00275 22.0049 6.4799 22.0049 12.0027C22.0049 17.5256 17.5277 22.0027 12.0049 22.0027ZM12.0049 20.0027C16.4232 20.0027 20.0049 16.421 20.0049 12.0027C20.0049 7.58447 16.4232 4.00275 12.0049 4.00275C7.5866 4.00275 4.00488 7.58447 4.00488 12.0027C4.00488 16.421 7.5866 20.0027 12.0049 20.0027ZM8.50488 14.0027H14.0049C14.281 14.0027 14.5049 13.7789 14.5049 13.5027C14.5049 13.2266 14.281 13.0027 14.0049 13.0027H10.0049C8.62417 13.0027 7.50488 11.8835 7.50488 10.5027C7.50488 9.12203 8.62417 8.00275 10.0049 8.00275H11.0049V6.00275H13.0049V8.00275H15.5049V10.0027H10.0049C9.72874 10.0027 9.50488 10.2266 9.50488 10.5027C9.50488 10.7789 9.72874 11.0027 10.0049 11.0027H14.0049C15.3856 11.0027 16.5049 12.122 16.5049 13.5027C16.5049 14.8835 15.3856 16.0027 14.0049 16.0027H13.0049V18.0027H11.0049V16.0027H8.50488V14.0027Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/shopping-cart-2-line.svelte
function Shopping_cart_2_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-shopping-cart-2-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M4.00436 6.41686L0.761719 3.17422L2.17593 1.76001L5.41857 5.00265H20.6603C21.2126 5.00265 21.6603 5.45037 21.6603 6.00265C21.6603 6.09997 21.6461 6.19678 21.6182 6.29L19.2182 14.29C19.0913 14.713 18.7019 15.0027 18.2603 15.0027H6.00436V17.0027H17.0044V19.0027H5.00436C4.45207 19.0027 4.00436 18.5549 4.00436 18.0027V6.41686ZM6.00436 7.00265V13.0027H17.5163L19.3163 7.00265H6.00436ZM5.50436 23.0027C4.67593 23.0027 4.00436 22.3311 4.00436 21.5027C4.00436 20.6742 4.67593 20.0027 5.50436 20.0027C6.33279 20.0027 7.00436 20.6742 7.00436 21.5027C7.00436 22.3311 6.33279 23.0027 5.50436 23.0027ZM17.5044 23.0027C16.6759 23.0027 16.0044 22.3311 16.0044 21.5027C16.0044 20.6742 16.6759 20.0027 17.5044 20.0027C18.3328 20.0027 19.0044 20.6742 19.0044 21.5027C19.0044 22.3311 18.3328 23.0027 17.5044 23.0027Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/chat/chat-mascot.svelte
function Chat_mascot($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { mood = "idle", interactive = false, still = false, class: className } = $$props;
		let look = {
			x: 0,
			y: 0
		};
		element($$renderer, interactive ? "button" : "span", () => {
			$$renderer.push(`${attr("type", interactive ? "button" : void 0)}${attr("aria-label", interactive ? "Maskot asisten" : void 0)}${attr("aria-hidden", interactive ? void 0 : true)}${attr_class(clsx$1(cn("mascot", className)), "svelte-12ht18h")}${attr("data-mood", mood)}${attr("data-still", still ? "" : void 0)}${attr("data-boop", void 0)}${attr_style(`--lx: ${stringify(look.x.toFixed(3))}; --ly: ${stringify(look.y.toFixed(3))}`)}`);
		}, () => {
			$$renderer.push(`<span class="bob svelte-12ht18h"><span class="orb svelte-12ht18h"><span class="swirl svelte-12ht18h"><span class="blob mint svelte-12ht18h"></span> <span class="blob teal svelte-12ht18h"></span> <span class="blob deep svelte-12ht18h"></span> <span class="blob lime svelte-12ht18h"></span> <span class="blob cyan svelte-12ht18h"></span></span> <span class="blob spot svelte-12ht18h"></span> <span class="rim svelte-12ht18h"></span> <span class="eyes svelte-12ht18h"><!--[-->`);
			const each_array = ensure_array_like([0, 1]);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				each_array[$$index];
				$$renderer.push(`<svg class="eye svelte-12ht18h" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 7 32 37 20 31 8 37Z" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round" class="svelte-12ht18h"></path></svg>`);
			}
			$$renderer.push(`<!--]--></span></span></span>`);
		});
	});
}
//#endregion
//#region src/routes/chatbot/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const modes = [{
			value: "explain",
			label: "Penjelasan",
			icon: File_list_3_line
		}, {
			value: "reference",
			label: "Referensi",
			icon: Links_line
		}];
		const departments = [
			{
				value: null,
				label: "Semua"
			},
			{
				value: "HCM",
				label: "HCM"
			},
			{
				value: "MIS",
				label: "MIS"
			}
		];
		const suggestions = [
			{
				icon: Calendar_check_line,
				text: "Bagaimana cara mengajukan cuti?"
			},
			{
				icon: Money_dollar_circle_line,
				text: "Apa syarat pengajuan uang muka kerja?"
			},
			{
				icon: Shopping_cart_2_line,
				text: "Siapa yang menyetujui pengadaan barang?"
			}
		];
		let messages = [];
		let query = "";
		let chatMode = "explain";
		let department = null;
		const pill = "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground";
		const pillActive = "bg-background text-foreground shadow-sm";
		head("1f2b8o8", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Asisten SOP · PostIt</title>`);
			});
		});
		$$renderer.push(`<div class="flex h-dvh flex-col bg-background text-foreground"><header class="flex shrink-0 items-center gap-3 px-4 py-3 md:px-6 short:py-2">`);
		Chat_mascot($$renderer, {
			class: "w-9",
			mood: "idle",
			interactive: true
		});
		$$renderer.push(`<!----> <div class="min-w-0 leading-tight"><p class="truncate text-[15px] font-bold tracking-tight">Asisten SOP</p> <p class="truncate text-xs text-muted-foreground">${escape_html("Siap membantu soal SOP & IK")}</p></div> <div class="ml-auto flex items-center gap-2">`);
		if (messages.length) {
			$$renderer.push(`<!--[0--><button type="button" class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary">`);
			Chat_new_line($$renderer, { class: "size-4" });
			$$renderer.push(`<!----> <span class="hidden sm:inline">Percakapan baru</span></button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="rounded-full bg-muted">`);
		Theme_toggle($$renderer);
		$$renderer.push(`<!----></div></div></header> <div class="min-h-0 flex-1 overflow-y-auto"><div class="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 md:px-6">`);
		if (messages.length === 0) {
			$$renderer.push(`<!--[0--><div class="flex flex-1 flex-col items-center justify-center py-3 text-center tall:py-6 tall:md:py-10"><div class="relative"><div class="pointer-events-none absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl tall:-inset-16 tall:blur-3xl dark:bg-emerald-400/10"></div> `);
			Chat_mascot($$renderer, {
				class: "w-24 tall:w-32 tall:md:w-44",
				interactive: true
			});
			$$renderer.push(`<!----> <div class="absolute -top-2 -left-11 rounded-2xl rounded-br-md bg-card px-3 py-1.5 text-sm font-semibold shadow-lg ring-1 ring-border tall:-top-3 tall:-left-12 tall:px-4 tall:py-2 tall:text-base tall:md:-left-16">Halo!</div></div> <h1 class="mt-4 text-2xl font-bold tracking-tight tall:mt-7 tall:md:mt-10 tall:md:text-3xl">Ada yang bisa saya bantu?</h1> <p class="mt-1.5 max-w-md text-sm text-muted-foreground tall:mt-2">Tanyakan apa saja tentang SOP dan Instruksi Kerja. Saya carikan jawabannya beserta dokumen
						sumbernya.</p> <div class="mt-5 grid w-full gap-2 sm:grid-cols-3 sm:gap-2.5 tall:mt-6 tall:md:mt-8"><!--[-->`);
			const each_array = ensure_array_like(suggestions);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let suggestion = each_array[$$index];
				const Icon = suggestion.icon;
				$$renderer.push(`<button type="button" class="group flex items-center gap-3 rounded-2xl border bg-card p-2.5 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md tall:items-start tall:p-3.5 tall:sm:flex-col"><span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">`);
				if (Icon) {
					$$renderer.push("<!--[-->");
					Icon($$renderer, { class: "size-[18px]" });
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
				$$renderer.push(`</span> ${escape_html(suggestion.text)}</button>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		} else {
			$$renderer.push(`<!--[-1--><div class="flex flex-col gap-7 py-6"><!--[-->`);
			const each_array_1 = ensure_array_like(messages);
			for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
				let msg = each_array_1[i];
				if (msg.role === "user") $$renderer.push(`<!--[0--><div class="ml-auto max-w-[85%] rounded-3xl rounded-br-lg bg-primary/10 px-4 py-2.5 text-[15px] whitespace-pre-wrap">${escape_html(msg.content)}</div>`);
				else {
					$$renderer.push("<!--[-1-->");
					const { text, sources } = splitSources(msg.content);
					$$renderer.push(`<div class="flex gap-3">`);
					Chat_mascot($$renderer, {
						class: "mt-0.5 w-8 self-start",
						still: true,
						mood: "idle"
					});
					$$renderer.push(`<!----> <div class="min-w-0 flex-1">`);
					if (text) $$renderer.push(`<!--[0--><div class="prose prose-sm max-w-none text-[15px] leading-relaxed dark:prose-invert prose-headings:tracking-tight prose-a:text-primary">${html(marked.parse(text))}</div>`);
					else {
						$$renderer.push(`<!--[-1--><p class="flex items-center gap-1.5 pt-1.5 text-sm text-muted-foreground">Mencari di dokumen SOP <!--[-->`);
						const each_array_2 = ensure_array_like([
							0,
							1,
							2
						]);
						for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
							let dot = each_array_2[$$index_1];
							$$renderer.push(`<span class="size-1 animate-bounce rounded-full bg-primary"${attr_style(`animation-delay: ${stringify(dot * .15)}s`)}></span>`);
						}
						$$renderer.push(`<!--]--></p>`);
					}
					$$renderer.push(`<!--]--> `);
					if (sources.length) {
						$$renderer.push(`<!--[0--><p class="mt-5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Dokumen terkait</p> <div class="mt-2 grid gap-2 sm:grid-cols-2"><!--[-->`);
						const each_array_3 = ensure_array_like(sources);
						for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
							let source = each_array_3[$$index_3];
							$$renderer.push(`<div class="group relative flex items-start gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-md"><span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">`);
							File_pdf_2_line($$renderer, { class: "size-5" });
							$$renderer.push(`<!----></span> <div class="min-w-0 flex-1"><a${attr("href", source.url)} target="_blank" rel="noopener" class="line-clamp-2 text-sm leading-snug font-semibold after:absolute after:inset-0 after:rounded-2xl">${escape_html(source.title)}</a> `);
							if (source.pages.length) {
								$$renderer.push(`<!--[0--><div class="mt-1.5 flex flex-wrap gap-1"><!--[-->`);
								const each_array_4 = ensure_array_like(source.pages);
								for (let $$index_2 = 0, $$length = each_array_4.length; $$index_2 < $$length; $$index_2++) {
									let page = each_array_4[$$index_2];
									$$renderer.push(`<a${attr("href", page.url)} target="_blank" rel="noopener" class="relative z-10 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-primary hover:text-primary-foreground">Hal. ${escape_html(page.page)}</a>`);
								}
								$$renderer.push(`<!--]--></div>`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></div> `);
							Arrow_right_up_line($$renderer, { class: "size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" });
							$$renderer.push(`<!----></div>`);
						}
						$$renderer.push(`<!--]--></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div></div> <footer class="shrink-0 px-4 pb-4 md:px-6 short:pb-3"><form class="mx-auto w-full max-w-3xl rounded-[1.75rem] border bg-card p-2 shadow-lg shadow-black/5 transition focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10"><textarea rows="1" placeholder="Tanyakan sesuatu tentang SOP atau IK…" class="block max-h-[200px] w-full resize-none border-0 bg-transparent px-3 pt-2.5 pb-2 text-[15px] placeholder:text-muted-foreground focus:ring-0">`);
		const $$body = escape_html(query);
		if ($$body) $$renderer.push(`${$$body}`);
		$$renderer.push(`</textarea> <div class="flex flex-wrap items-center gap-2 pt-1"><div class="flex rounded-full bg-muted p-0.5" role="group" aria-label="Mode jawaban"><!--[-->`);
		const each_array_5 = ensure_array_like(modes);
		for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
			let mode = each_array_5[$$index_5];
			const Icon = mode.icon;
			$$renderer.push(`<button type="button"${attr_class(clsx$1(cn(pill, chatMode === mode.value && pillActive)))}${attr("aria-pressed", chatMode === mode.value)}>`);
			if (Icon) {
				$$renderer.push("<!--[-->");
				Icon($$renderer, { class: "size-3.5" });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(` ${escape_html(mode.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div> <div class="flex rounded-full bg-muted p-0.5" role="group" aria-label="Departemen"><!--[-->`);
		const each_array_6 = ensure_array_like(departments);
		for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
			let item = each_array_6[$$index_6];
			$$renderer.push(`<button type="button"${attr_class(clsx$1(cn(pill, department === item.value && pillActive)))}${attr("aria-pressed", department === item.value)}>${escape_html(item.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push(`<!--[-1--><button type="submit"${attr("disabled", !query.trim(), true)} aria-label="Kirim" class="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/85 disabled:opacity-40">`);
		Arrow_up_line($$renderer, { class: "size-5" });
		$$renderer.push(`<!----></button>`);
		$$renderer.push(`<!--]--></div></form> <p class="mt-2 text-center text-[11px] text-muted-foreground short:hidden">Jawaban AI bisa keliru. Selalu cek dokumen sumbernya.</p></footer></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-CZJ7zp_b.js.map
