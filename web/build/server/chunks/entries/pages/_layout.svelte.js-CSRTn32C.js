import { ag as head, ah as attr } from '../../chunks/server.js-Dzkc9wbJ.js';
import { f as favicon_default } from '../../chunks/favicon.js-D9-pimHV.js';
import '../../chunks/shared.js-CcLTIra1.js';

//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	let { children } = $$props;
	head("12qhfyh", $$renderer, ($$renderer) => {
		$$renderer.push(`<link rel="icon"${attr("href", favicon_default)}/>`);
	});
	children($$renderer);
	$$renderer.push(`<!---->`);
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte.js-CSRTn32C.js.map
