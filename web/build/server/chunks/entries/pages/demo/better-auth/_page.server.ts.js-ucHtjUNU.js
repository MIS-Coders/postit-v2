import { a as auth } from '../../../../chunks/auth.js-BedXumq9.js';
import { A as redirect } from '../../../../chunks/utils.js-C9mV3RNQ.js';

//#region src/routes/demo/better-auth/+page.server.ts
var load = (event) => {
	if (!event.locals.user) return redirect(302, "/demo/better-auth/login");
	return { user: event.locals.user };
};
var actions = { signOut: async (event) => {
	await auth.api.signOut({ headers: event.request.headers });
	return redirect(302, "/demo/better-auth/login");
} };

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-ucHtjUNU.js.map
