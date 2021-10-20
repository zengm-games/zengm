// Without this (and building this with esbuild prior to rollup) there were errors on import that I couldn't figure out. Something related to CommonJS/ESM transpiling.

import Ajv from "ajv";
export default Ajv;
