// Without this (and building this with esbuild prior to rollup) there were errors on import that I couldn't figure out. Basically, ajv needs to be transpiled for the legacy build because it uses (at a minimum) object rest/spread. But when telling Babel to transpile it, there was some weird issue where Rollup couldn't figure out if it was ESM or CommonJS and I couldn't get past that, it kept leaving it not correctly transpiled even if I used the Rollup commonjs settings to force it to be treated one way or the other. Building it with esbuild first solves that problem. This should be revisited when I no longer need to transpile object rest/spread.

import Ajv from "ajv";
export default Ajv;
