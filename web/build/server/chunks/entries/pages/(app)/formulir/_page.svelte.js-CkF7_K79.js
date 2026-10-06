import { S as Sop_browser } from '../../../../chunks/sop-browser.js-CIB1VIzM.js';
import '../../../../chunks/server.js-Dzkc9wbJ.js';
import '../../../../chunks/shared.js-CcLTIra1.js';
import '../../../../chunks/state.js-CwmYuGot.js';
import '../../../../chunks/client.js-CF_OK5QN.js';
import '../../../../chunks/routing.js-BH1owdF7.js';
import '../../../../chunks/exports.js-DohH99Hj.js';
import '../../../../chunks/index-server.js-BPE5KZij.js';
import '../../../../chunks/rolldown-runtime.js-pTpnEGsq.js';
import '../../../../chunks/internal2.js-BylYz_eZ.js';
import '../../../../chunks/legacy-client.js-BYqIYKJq.js';
import '../../../../chunks/utils.js-C9mV3RNQ.js';
import '../../../../chunks/file-text-line.js-C2j9SsLW.js';
import '../../../../chunks/utils2.js-7mvaj0Jt.js';
import '../../../../chunks/index-server2.js-DgXQ8-9Q.js';

//#region src/routes/(app)/formulir/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		Sop_browser($$renderer, {
			type: "FORM",
			departements: data.departements,
			docs: data.docs
		});
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-CkF7_K79.js.map
