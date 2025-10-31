import { Buffer } from "node:buffer";
import path from "node:path";
import fs from "node:fs/promises";
import { promisify } from "node:util";
import browserslist from "browserslist";
import { browserslistToTargets, transform } from "lightningcss";
import { PurgeCSS } from "purgecss";
import { render } from "sass-embedded";
import { fileHash } from "./fileHash.ts";
import { replace } from "./replace.ts";

export const buildCss = async (
	watch: boolean = false,
	signal?: AbortSignal,
) => {
	const filenames = ["light", "dark"];
	const rawCss = await Promise.all(
		filenames.map(async (filename) => {
			// sass-embedded is faster async, while sass is faster sync (but still slower than sass-embedded)
			const sassResult = await promisify(render)({
				file: `public/css/${filename}.scss`,
			});
			return sassResult!.css.toString();
		}),
	);
	if (signal?.aborted) {
		return;
	}

	const purgeCssResults = watch
		? []
		: await new PurgeCSS().purge({
				content: ["build/gen/*.js"],
				css: rawCss.map((raw) => ({ raw })),
				safelist: {
					standard: [/^qc-cmp2-persistent-link$/],
					greedy: [
						// react-bootstrap stuff
						/^modal/,
						/^navbar/,
						/^popover/,
						/^tooltip/,
						/^bs-tooltip/,

						// For align="end" in react-bootstrap
						/^dropdown-menu-end$/,

						// flag-icons
						/^fi$/,
						/^fi-/,

						/^dark-select/,
						/^bar-graph/,
						/^watch-active/,
						/^dashboard-top-link-other/,
					],
				},
			});
	if (signal?.aborted) {
		return;
	}

	const replaces: Parameters<typeof replace>[0]["replaces"] | undefined = watch
		? undefined
		: [];

	for (let i = 0; i < filenames.length; i++) {
		const filename = filenames[i]!;

		let output;
		if (!watch) {
			// https://zengm.com/blog/2022/07/investigating-a-tricky-performance-bug/
			const DANGER_CSS = ".input-group.has-validation";
			if (!rawCss[i]!.includes(DANGER_CSS)) {
				throw new Error(
					`rawCss no longer contains ${DANGER_CSS} - same problem might exist with another name?`,
				);
			}

			const purgeCSSResult = purgeCssResults[i]!.css;

			const { code } = transform({
				filename: `${filename}.css`,
				code: Buffer.from(purgeCSSResult),
				minify: true,
				sourceMap: false,
				targets: browserslistToTargets(
					browserslist(undefined, {
						config: path.join(import.meta.dirname, "../../.browserslistrc"),
					}),
				),
			});

			output = code.toString();

			if (output.includes(DANGER_CSS)) {
				throw new Error(`CSS output contains ${DANGER_CSS}`);
			}
		} else {
			output = rawCss[i]!;
		}

		let outFilename;
		if (watch) {
			outFilename = `build/gen/${filename}.css`;
		} else {
			const hash = fileHash(output);
			outFilename = `build/gen/${filename}-${hash}.css`;

			replaces!.push({
				searchValue: `CSS_HASH_${filename.toUpperCase()}`,
				replaceValue: hash,
			});
		}

		await fs.writeFile(outFilename, output, { signal });
		if (signal?.aborted) {
			return;
		}
	}

	if (replaces) {
		await replace({
			paths: ["build/index.html"],
			replaces,
			signal,
		});
	}
};
