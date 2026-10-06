import { g as getEmbedJob } from '../../../../../../chunks/embed.js-Ccnt-Gqu.js';
import { r as requireRole } from '../../../../../../chunks/roles.js-L5KGHkWT.js';
import { j as json } from '../../../../../../chunks/utils.js-C9mV3RNQ.js';
import '../../../../../../chunks/shared-server.js-9-2j12mp.js';
import '../../../../../../chunks/db.js-BcmXawsm.js';
import '../../../../../../chunks/rolldown-runtime.js-pTpnEGsq.js';
import 'os';
import 'fs';
import 'net';
import 'tls';
import 'crypto';
import 'stream';
import 'perf_hooks';
import '../../../../../../chunks/shared.js-CcLTIra1.js';

//#region src/routes/api/embed/jobs/[id]/+server.ts
var GET = async ({ locals, params }) => {
	await requireRole(locals, ["admin", "superadmin"]);
	return json(await getEmbedJob(params.id));
};

export { GET };
//# sourceMappingURL=_server.ts.js-BM-dZG_X.js.map
