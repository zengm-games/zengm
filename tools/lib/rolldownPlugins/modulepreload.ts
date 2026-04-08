import type { OutputChunk, RolldownPlugin } from "rolldown";

// Find all the filenames of the entry points and the JS files synchronously imported by the entry points, to put in modulepreload tags
export const modulepreload = (
	cb: (filenames: string[]) => void,
): RolldownPlugin => {
	return {
		name: "modulepreload",

		generateBundle(outputOptions, bundle) {
			const chunks: Record<string, OutputChunk> = {};
			for (const [fileName, item] of Object.entries(bundle)) {
				if (item.type === "chunk" && item.fileName.endsWith(".js")) {
					chunks[fileName] = item;
				}
			}

			// DFS over static imports, ignore dynamicImports
			const collected = new Set<string>();
			const visit = (fileName: string) => {
				if (collected.has(fileName)) {
					return;
				}
				collected.add(fileName);

				const chunk = chunks[fileName];
				if (!chunk) {
					return;
				}

				for (const imported of chunk.imports) {
					visit(imported);
				}
			};

			// Start from all entry chunks
			for (const chunk of Object.values(chunks)) {
				if (chunk.isEntry) {
					visit(chunk.fileName);
				}
			}

			cb(Array.from(collected));
		},
	};
};
