import { i as initial_base, b as base } from './internal.js--7Dn7GZH.js';
import { i as resolve_route, c as add_data_suffix } from './routing.js-BH1owdF7.js';
import './internal2.js-BylYz_eZ.js';
import { y as try_get_request_store } from './utils.js-C9mV3RNQ.js';

//#region node_modules/@sveltejs/kit/src/runtime/app/paths/server.js
/** @type {import('./client.js').resolve} */
function resolve(id, params) {
	if (!id.startsWith("/")) throw new Error(`Cannot use \`resolve(...)\` with a non-absolute pathname or route ID (got "${id}"). \`resolve\` is only for internal pathnames and route IDs; external URLs should be used directly.`);
	const resolved = resolve_route(id, params);
	{
		const store = try_get_request_store();
		if (store && !store.state.prerendering?.fallback) return ((store.event.isDataRequest ? add_data_suffix(store.event.url.pathname) : store.event.url.pathname).slice(initial_base.length).split("/").slice(2).map(() => "..").join("/") || ".") + resolved;
	}
	return base + resolved;
}

export { resolve as r };
//# sourceMappingURL=paths.js-DtjSmq1t.js.map
