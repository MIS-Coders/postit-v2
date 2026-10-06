//#region node_modules/@sveltejs/kit/src/runtime/app/paths/internal/server.js
var base = "";
var assets = base;
var app_dir = "_app";
var initial = {
	base,
	assets
};
/**
* `base` could be overridden during rendering to be relative;
* this one's the original non-relative base path
*/
var initial_base = initial.base;
/**
* @param {{ base: string, assets: string }} paths
*/
function override(paths) {
	base = paths.base;
	assets = paths.assets;
}
function reset() {
	base = initial.base;
	assets = initial.assets;
}
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/app/env/internal.js
var building = false;

export { assets as a, base as b, app_dir as c, building as d, initial_base as i, override as o, reset as r };
//# sourceMappingURL=internal.js--7Dn7GZH.js.map
