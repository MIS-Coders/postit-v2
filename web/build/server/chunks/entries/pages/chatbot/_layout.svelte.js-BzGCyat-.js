import { ag as head, ah as attr } from '../../../chunks/server.js-Dzkc9wbJ.js';
import { f as favicon_default } from '../../../chunks/favicon.js-D9-pimHV.js';
import '../../../chunks/shared.js-CcLTIra1.js';

//#region src/routes/chatbot/+layout.svelte
function _layout($$renderer, $$props) {
	let { children } = $$props;
	head("16sihfd", $$renderer, ($$renderer) => {
		$$renderer.push(`<link rel="icon"${attr("href", favicon_default)}/>`);
	});
	$$renderer.push(`<div class="contents font-['Plus_Jakarta_Sans_Variable',sans-serif]">`);
	children($$renderer);
	$$renderer.push(`<!----></div>`);
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte.js-BzGCyat-.js.map
