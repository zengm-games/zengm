import fs from "node:fs/promises";
import type { PathLike } from "node:fs";

export const replace = async ({
	paths,
	replaces,
}: {
	paths: (PathLike | fs.FileHandle)[];
	replaces: {
		searchValue: string | RegExp;
		replaceValue: string;
	}[];
}) => {
	for (const path of paths) {
		let contents = await fs.readFile(path, "utf8");
		for (const { searchValue, replaceValue } of replaces) {
			contents = contents.replaceAll(searchValue, replaceValue);
		}
		await fs.writeFile(path, contents);
	}
};
