import fs from "node:fs/promises";
import { minify } from "html-minifier-terser";

export const minifyIndexHtml = async () => {
	const content = await fs.readFile("build/index.html", "utf8");
	const minified = await minify(content, {
		collapseBooleanAttributes: true,
		collapseWhitespace: true,
		minifyCSS: true,
		minifyJS: true,
		removeComments: true,
		useShortDoctype: true,
	});
	await fs.writeFile("build/index.html", minified);
};
