import { Buffer } from "node:buffer";
import fs from "node:fs";
import browserslist from "browserslist";
import * as lightningCSS from "lightningcss";
import { PurgeCSS } from "purgecss";
import * as sass from "sass";
import { fileHash } from "./fileHash.ts";
import { replace } from "./replace.ts";

export const buildCss = async (watch: boolean = false) => {
	const filenames = ["light", "dark"];
	const rawCSS = filenames.map((filename) => {
		const sassFilePath = `public/css/${filename}.scss`;
		const sassResult = sass.renderSync({
			file: sassFilePath,
		});
		return sassResult.css.toString();
	});

	const purgeCSSResults = watch
		? []
		: await new PurgeCSS().purge({
				content: ["build/gen/*.js"],
				css: rawCSS.map((raw) => ({ raw })),
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

	for (let i = 0; i < filenames.length; i++) {
		const filename = filenames[i];

		let output;
		if (!watch) {
			// https://zengm.com/blog/2022/07/investigating-a-tricky-performance-bug/
			const DANGER_CSS = ".input-group.has-validation";
			if (!rawCSS[i].includes(DANGER_CSS)) {
				throw new Error(
					`rawCSS no longer contains ${DANGER_CSS} - same problem might exist with another name?`,
				);
			}

			const purgeCSSResult = purgeCSSResults[i].css;

			const { code } = lightningCSS.transform({
				filename: `${filename}.css`,
				code: Buffer.from(purgeCSSResult),
				minify: true,
				sourceMap: false,
				targets: lightningCSS.browserslistToTargets(
					browserslist("Chrome >= 75, Firefox >= 78, Safari >= 12.1"),
				),
			});

			output = code.toString();

			if (output.includes(DANGER_CSS)) {
				throw new Error(`CSS output contains ${DANGER_CSS}`);
			}
		} else {
			output = rawCSS[i];
		}

		let outFilename;
		if (watch) {
			outFilename = `build/gen/${filename}.css`;
		} else {
			const hash = fileHash(output);
			outFilename = `build/gen/${filename}-${hash}.css`;

			replace({
				paths: ["build/index.html"],
				replaces: [
					{
						searchValue: `CSS_HASH_${filename.toUpperCase()}`,
						replaceValue: hash,
					},
				],
			});
		}

		fs.writeFileSync(outFilename, output);
	}
};
