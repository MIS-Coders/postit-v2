import { ai as escape_html } from '../../../../../chunks/server.js-Dzkc9wbJ.js';
import '../../../../../chunks/client.js-CF_OK5QN.js';
import '../../../../../chunks/shared.js-CcLTIra1.js';
import '../../../../../chunks/routing.js-BH1owdF7.js';
import '../../../../../chunks/exports.js-DohH99Hj.js';
import '../../../../../chunks/index-server.js-BPE5KZij.js';
import '../../../../../chunks/rolldown-runtime.js-pTpnEGsq.js';
import '../../../../../chunks/internal2.js-BylYz_eZ.js';
import '../../../../../chunks/legacy-client.js-BYqIYKJq.js';
import '../../../../../chunks/utils.js-C9mV3RNQ.js';

//#region src/routes/demo/better-auth/login/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { form } = $$props;
		$$renderer.push(`<h1>Login</h1> <form method="post" action="?/signInEmail"><label>Email <input type="email" name="email" class="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/></label> <label>Password <input type="password" name="password" class="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/></label> <label>Name (for registration) <input name="name" class="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/></label> <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Login</button> <button formaction="?/signUpEmail" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Register</button></form> <p class="text-red-500">${escape_html(form?.message ?? "")}</p>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-BuR9Lb-0.js.map
