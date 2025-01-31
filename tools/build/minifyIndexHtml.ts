import fs from "node:fs";
import { minify } from "html-minifier-terser";

export const minifyIndexHtml = async () => {
	const content = fs.readFileSync("build/index.html", "utf8");
	const minified = await minify(content, {
		collapseBooleanAttributes: true,
		collapseWhitespace: true,
		minifyCSS: true,
		minifyJS: true,
		removeComments: true,
		useShortDoctype: true,
	});
	fs.writeFileSync("build/index.html", minified);
};
