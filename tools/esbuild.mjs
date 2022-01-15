import esbuild from "esbuild";
import esbuildConfig from "./lib/esbuildConfig.mjs";

/**
 * Currently this is not used for anything. Eventually maybe it can replace the current rollup build script. Would need to do:
 *
 * - Figure out what to do with Karma and Jest
 * - Module aliases for prod build
 * - Do something about extra rollup plugins (like blacklist)
 * - Compare bundle size (maybe still use terser)
 * - Figure out what targets to use for the prod/legacy builds, and confirm it all works
 *   - Might not support all the features needed for legacy
 *     - https://esbuild.github.io/content-types/#javascript
 *     - https://github.com/evanw/esbuild/issues/297
 *   - Could still use babel on output
 */

const names = ["ui", "worker"];
await Promise.all(
	names.map(async name => {
		await esbuild.build({
			...esbuildConfig({
				name,
				nodeEnv: "production",
			}),
		});
	}),
);
