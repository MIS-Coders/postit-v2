import { a as auth } from '../../../chunks/auth.js-BedXumq9.js';
import { A as redirect } from '../../../chunks/utils.js-C9mV3RNQ.js';
import '../../../chunks/rolldown-runtime.js-pTpnEGsq.js';
import '../../../chunks/shared.js-CcLTIra1.js';
import '../../../chunks/shared-server.js-9-2j12mp.js';
import '../../../chunks/db.js-BcmXawsm.js';
import 'os';
import 'fs';
import 'net';
import 'tls';
import 'crypto';
import 'stream';
import 'perf_hooks';
import '../../../chunks/password.js-DN-GAMRv.js';
import 'node:crypto';
import '../../../chunks/routing.js-BH1owdF7.js';
import '../../../chunks/internal2.js-BylYz_eZ.js';
import '../../../chunks/server.js-Dzkc9wbJ.js';
import '../../../chunks/legacy-client.js-BYqIYKJq.js';
import 'node:fs';
import 'node:fs/promises';
import 'node:os';
import 'node:path';

//#region src/routes/logout/+server.ts
var POST = async (event) => {
	await auth.api.signOut({ headers: event.request.headers });
	redirect(303, "/login");
};

export { POST };
//# sourceMappingURL=_server.ts.js-vVuALent.js.map
