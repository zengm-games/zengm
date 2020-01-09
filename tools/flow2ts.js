const babel = require("@babel/core");
const flowToTypescript = require("babel-plugin-flow-to-typescript");
const fs = require("fs");
const glob = require("glob");
const prettier = require("prettier");

const getFileExtension = code => {
	if (code.includes('from "react"')) {
		return ".tsx";
	}

	return ".ts";
};

const prettierFormat = code => {
	const prettierConfig = prettier.resolveConfig.sync(".");
	return prettier.format(code, {
		...prettierConfig,
		parser: "typescript",
	});
};

const transformFile = async filename => {
	console.log(`converting ${filename} to TypeScript`);
	const { code } = babel.transformFileSync(filename, {
		plugins: [flowToTypescript],
	});

	const extension = getFileExtension(code);
	const tsFilename = filename.replace(".js", extension);

	const prettierCode = prettierFormat(code);

	console.log(`deleting ${filename}`);
	fs.unlinkSync(filename);
	console.log(`writing ${tsFilename}`);
	await fs.writeFileSync(tsFilename, prettierCode);
};

const main = async () => {
	const files = glob.sync("./src/**/*.js");
	for (const filename of files) {
		const contents = fs.readFileSync(filename);
		if (
			contents.includes("@flow") ||
			contents.includes("import type") ||
			contents.includes("?:") ||
			contents.includes(": number")
		) {
			await transformFile(filename);
		}
	}
};

main().catch(console.error);
