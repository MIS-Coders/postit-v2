import { ai as escape_html } from '../../chunks/server.js-Dzkc9wbJ.js';
import { p as page } from '../../chunks/state.js-CwmYuGot.js';
import '../../chunks/shared.js-CcLTIra1.js';
import '../../chunks/client.js-CF_OK5QN.js';
import '../../chunks/routing.js-BH1owdF7.js';
import '../../chunks/exports.js-DohH99Hj.js';
import '../../chunks/index-server.js-BPE5KZij.js';
import '../../chunks/rolldown-runtime.js-pTpnEGsq.js';
import '../../chunks/internal2.js-BylYz_eZ.js';
import '../../chunks/legacy-client.js-BYqIYKJq.js';
import '../../chunks/utils.js-C9mV3RNQ.js';

//#region node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte
function Error($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
	});
}

export { Error as default };
//# sourceMappingURL=error.svelte.js-C7i-_Y8U.js.map
