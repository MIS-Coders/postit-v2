import { ai as escape_html } from '../../../../chunks/server.js-Dzkc9wbJ.js';
import '../../../../chunks/client.js-CF_OK5QN.js';
import '../../../../chunks/shared.js-CcLTIra1.js';
import '../../../../chunks/routing.js-BH1owdF7.js';
import '../../../../chunks/exports.js-DohH99Hj.js';
import '../../../../chunks/index-server.js-BPE5KZij.js';
import '../../../../chunks/rolldown-runtime.js-pTpnEGsq.js';
import '../../../../chunks/internal2.js-BylYz_eZ.js';
import '../../../../chunks/legacy-client.js-BYqIYKJq.js';
import '../../../../chunks/utils.js-C9mV3RNQ.js';

//#region src/routes/demo/better-auth/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		$$renderer.push(`<h1>Hi, ${escape_html(data.user.name)}!</h1> <p>Your user ID is ${escape_html(data.user.id)}.</p> <form method="post" action="?/signOut"><button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Sign out</button></form>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-DjhoczIf.js.map
