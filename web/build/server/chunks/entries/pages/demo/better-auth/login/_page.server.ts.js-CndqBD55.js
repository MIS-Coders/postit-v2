import { a as auth, A as APIError } from '../../../../../chunks/auth.js-BedXumq9.js';
import { B as fail, A as redirect } from '../../../../../chunks/utils.js-C9mV3RNQ.js';

//#region src/routes/demo/better-auth/login/+page.server.ts
var load = (event) => {
	if (event.locals.user) return redirect(302, "/demo/better-auth");
	return {};
};
var actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get("email")?.toString() ?? "";
		const password = formData.get("password")?.toString() ?? "";
		try {
			await auth.api.signInEmail({ body: {
				email,
				password,
				callbackURL: "/auth/verification-success"
			} });
		} catch (error) {
			if (error instanceof APIError) return fail(400, { message: error.message || "Signin failed" });
			return fail(500, { message: "Unexpected error" });
		}
		return redirect(302, "/demo/better-auth");
	},
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get("email")?.toString() ?? "";
		const password = formData.get("password")?.toString() ?? "";
		const name = formData.get("name")?.toString() ?? "";
		try {
			await auth.api.signUpEmail({ body: {
				email,
				password,
				name,
				callbackURL: "/auth/verification-success"
			} });
		} catch (error) {
			if (error instanceof APIError) return fail(400, { message: error.message || "Registration failed" });
			return fail(500, { message: "Unexpected error" });
		}
		return redirect(302, "/demo/better-auth");
	}
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-CndqBD55.js.map
