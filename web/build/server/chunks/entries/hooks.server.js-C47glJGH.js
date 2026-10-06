import { d as building } from '../chunks/internal.js--7Dn7GZH.js';
import { a as auth, s as svelteKitHandler } from '../chunks/auth.js-BedXumq9.js';
import '../chunks/rolldown-runtime.js-pTpnEGsq.js';
import '../chunks/shared.js-CcLTIra1.js';
import '../chunks/shared-server.js-9-2j12mp.js';
import '../chunks/utils.js-C9mV3RNQ.js';
import '../chunks/db.js-BcmXawsm.js';
import 'os';
import 'fs';
import 'net';
import 'tls';
import 'crypto';
import 'stream';
import 'perf_hooks';
import '../chunks/password.js-DN-GAMRv.js';
import 'node:crypto';
import '../chunks/routing.js-BH1owdF7.js';
import '../chunks/internal2.js-BylYz_eZ.js';
import '../chunks/server.js-Dzkc9wbJ.js';
import '../chunks/legacy-client.js-BYqIYKJq.js';
import 'node:fs';
import 'node:fs/promises';
import 'node:os';
import 'node:path';

//#region src/hooks.server.ts
var handleBetterAuth = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({
		event,
		resolve,
		auth,
		building
	});
};
var handle = handleBetterAuth;

export { handle };
//# sourceMappingURL=hooks.server.js-C47glJGH.js.map
