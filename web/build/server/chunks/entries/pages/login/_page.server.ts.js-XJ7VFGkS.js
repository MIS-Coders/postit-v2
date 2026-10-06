import { a as auth, A as APIError } from '../../../chunks/auth.js-BedXumq9.js';
import { B as fail, A as redirect } from '../../../chunks/utils.js-C9mV3RNQ.js';

//#region src/routes/login/+page.server.ts
var load = ({ locals }) => {
	if (locals.user) redirect(303, "/sop");
};
var actions = {
	signIn: async (event) => {
		const data = await event.request.formData();
		try {
			await auth.api.signInEmail({
				body: {
					email: String(data.get("email") || ""),
					password: String(data.get("password") || ""),
					callbackURL: "/sop"
				},
				headers: event.request.headers
			});
		} catch (cause) {
			return fail(cause instanceof APIError ? 400 : 500, { error: cause instanceof APIError ? cause.message : "Login gagal." });
		}
		redirect(303, "/sop");
	},
	signUp: async (event) => {
		const data = await event.request.formData();
		try {
			await auth.api.signUpEmail({
				body: {
					name: String(data.get("name") || ""),
					email: String(data.get("email") || ""),
					password: String(data.get("password") || ""),
					callbackURL: "/sop"
				},
				headers: event.request.headers
			});
		} catch (cause) {
			return fail(cause instanceof APIError ? 400 : 500, { error: cause instanceof APIError ? cause.message : "Pendaftaran gagal." });
		}
		redirect(303, "/sop");
	}
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-XJ7VFGkS.js.map
