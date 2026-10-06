import { randomBytes, scrypt } from 'node:crypto';

const config = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64
};
function generateKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      config.dkLen,
      {
        N: config.N,
        r: config.r,
        p: config.p,
        maxmem: 128 * config.N * config.r * 2
      },
      (err, key) => {
        if (err)
          reject(err);
        else
          resolve(key);
      }
    );
  });
}
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await generateKey(password, salt);
  return `${salt}:${key.toString("hex")}`;
}
async function verifyPassword(hash, password) {
  const [salt, key] = hash.split(":");
  if (!salt || !key) {
    throw new Error("Invalid password hash");
  }
  const targetKey = await generateKey(password, salt);
  return targetKey.toString("hex") === key;
}

//#region node_modules/better-auth/dist/crypto/password.mjs
/**
* `@better-auth/utils/password` uses the "node" export condition in package.json
* to automatically pick the right implementation:
*   - Node.js / Bun / Deno → `node:crypto scrypt` (libuv thread pool, non-blocking)
*   - Unsupported runtimes → `@noble/hashes scrypt` (pure JS fallback)
*/
var hashPassword$1 = hashPassword;
var verifyPassword$1 = async ({ hash, password }) => {
	return verifyPassword(hash, password);
};

export { hashPassword$1 as h, verifyPassword$1 as v };
//# sourceMappingURL=password.js-DN-GAMRv.js.map
