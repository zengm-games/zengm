import fs from "node:fs";

export const replace = ({
	paths,
	replaces,
}: {
	paths: fs.PathOrFileDescriptor[];
	replaces: {
		searchValue: string | RegExp;
		replaceValue: string;
	}[];
}) => {
	for (const path of paths) {
		let contents = fs.readFileSync(path, "utf8");
		for (const { searchValue, replaceValue } of replaces) {
			contents = contents.replaceAll(searchValue, replaceValue);
		}
		fs.writeFileSync(path, contents);
	}
};
