/* eslint-disable @typescript-eslint/no-require-imports -- a CommonJS preload: `require` is the only way in. */
/**
 * Lets scripts run app services under plain Node.
 *
 * Services such as order-mail import `server-only`, which throws whenever it
 * is loaded outside a React Server Component bundle — so a script that touches
 * them (the seed creates real orders through `createOrder`) would crash on
 * import. Preloaded with `node --require`, this resolves that one module to an
 * empty one. It changes nothing inside Next, which never loads this file.
 */
const Module = require("module");
const path = require("path");

const EMPTY = path.join(__dirname, "server-only-empty.cjs");
const resolve = Module._resolveFilename;

Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return EMPTY;
  return resolve.call(this, request, ...rest);
};
