import { a as getSopFilePath } from '../../../../../../chunks/sop.js-BBrYzUff.js';
import { v as error } from '../../../../../../chunks/utils.js-C9mV3RNQ.js';
import { readFile } from 'node:fs/promises';
import '../../../../../../chunks/shared-server.js-9-2j12mp.js';
import 'node:fs';
import 'node:path';
import '../../../../../../chunks/shared.js-CcLTIra1.js';

//#region src/routes/api/sop/[id]/file/+server.ts
var GET = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(400, "Id dokumen tidak valid");
	const file = getSopFilePath(id);
	if (!file) error(404, "File dokumen tidak ditemukan");
	return new Response(await readFile(file), { headers: {
		"Content-Type": "application/pdf",
		"Content-Disposition": "inline",
		"Cache-Control": "private, no-store",
		"X-Content-Type-Options": "nosniff"
	} });
};

export { GET };
//# sourceMappingURL=_server.ts.js-BhcpEO5v.js.map
