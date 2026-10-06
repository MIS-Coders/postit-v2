import { aj as attributes, ak as stringify, al as attr_class, am as clsx$1, ah as attr } from './server.js-Dzkc9wbJ.js';
import { c as cn } from './utils2.js-7mvaj0Jt.js';

//#region node_modules/remixicon-svelte/dist/icons/file-list-3-line.svelte
function File_list_3_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-file-list-3-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M19 22H5C3.34315 22 2 20.6569 2 19V3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3V15H22V19C22 20.6569 20.6569 22 19 22ZM18 17V19C18 19.5523 18.4477 20 19 20C19.5523 20 20 19.5523 20 19V17H18ZM16 20V4H4V19C4 19.5523 4.44772 20 5 20H16ZM6 7H14V9H6V7ZM6 11H14V13H6V11ZM6 15H11V17H6V15Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/moon-line.svelte
function Moon_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-moon-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/sun-line.svelte
function Sun_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-sun-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/app/theme-toggle.svelte
function Theme_toggle($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let dark = false;
		const item = "flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground";
		$$renderer.push(`<div class="flex items-center gap-0.5 rounded-full p-0.5" role="group" aria-label="Tema"><button type="button"${attr_class(clsx$1(cn(item, dark)))}${attr("aria-pressed", dark)} aria-label="Mode gelap">`);
		Moon_line($$renderer, { class: "size-4" });
		$$renderer.push(`<!----></button> <button type="button"${attr_class(clsx$1(cn(item, "bg-background text-foreground shadow-sm")))}${attr("aria-pressed", true)} aria-label="Mode terang">`);
		Sun_line($$renderer, { class: "size-4" });
		$$renderer.push(`<!----></button></div>`);
	});
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/arrow-up-line.svelte
function Arrow_up_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-arrow-up-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M13.0001 7.82843V20H11.0001V7.82843L5.63614 13.1924L4.22192 11.7782L12.0001 4L19.7783 11.7782L18.3641 13.1924L13.0001 7.82843Z"></path></svg>`);
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/chat-new-line.svelte
function Chat_new_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-chat-new-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M14 3V5H4V18.3851L5.76282 17H20V10H22V18C22 18.5523 21.5523 19 21 19H6.45455L2 22.5V4C2 3.44772 2.44772 3 3 3H14ZM19 3V0H21V3H24V5H21V8H19V5H16V3H19Z"></path></svg>`);
}

export { Arrow_up_line as A, Chat_new_line as C, File_list_3_line as F, Theme_toggle as T };
//# sourceMappingURL=chat-new-line.js-CufkO4C-.js.map
