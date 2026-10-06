//#region node_modules/@sveltejs/kit/src/runtime/shared-server.js
/**
* `$env/dynamic/private`
* @type {Record<string, string>}
*/
var private_env = {};
/**
* `$env/dynamic/public`
* @type {Record<string, string>}
*/
var public_env = {};
/** @type {(environment: Record<string, string>) => void} */
function set_private_env(environment) {
	private_env = environment;
}
/** @type {(environment: Record<string, string>) => void} */
function set_public_env(environment) {
	public_env = environment;
}

export { set_public_env as a, private_env as b, public_env as p, set_private_env as s };
//# sourceMappingURL=shared-server.js-9-2j12mp.js.map
