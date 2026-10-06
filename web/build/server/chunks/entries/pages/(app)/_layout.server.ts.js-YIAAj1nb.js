import { g as getRole } from '../../../chunks/roles.js-L5KGHkWT.js';

//#region src/routes/(app)/+layout.server.ts
var load = async ({ locals }) => ({
	user: locals.user ? {
		name: locals.user.name,
		email: locals.user.email
	} : null,
	role: locals.user ? await getRole(locals.user.id) : null
});

var _layout_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

export { _layout_server_ts as _ };
//# sourceMappingURL=_layout.server.ts.js-YIAAj1nb.js.map
