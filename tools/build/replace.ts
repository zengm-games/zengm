import fs from "node:fs/promises";
import type { PathLike } from "node:fs";

export const replace = async ({
	paths,
	replaces,
	signal,
}: {
	paths: (PathLike | fs.FileHandle)[];
	replaces: {
		searchValue: string | RegExp;
		replaceValue: string;
	}[];
	signal?: AbortSignal;
}) => {
	for (const path of paths) {
		let contents = await fs.readFile(path, { encoding: "utf8", signal });
		if (signal?.aborted) {
			return;
		}

		for (const { searchValue, replaceValue } of replaces) {
			contents = contents.replaceAll(searchValue, replaceValue);
		}

		await fs.writeFile(path, contents, { signal });
		if (signal?.aborted) {
			return;
		}
	}
};
