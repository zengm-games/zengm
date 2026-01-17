import type { generateJsonSchema as generateJsonSchemaType } from "../../build/generateJsonSchema.ts";
import type { RolldownPlugin } from "rolldown";
import path from "node:path";
import type { Sport } from "../getSport.ts";

// https://ar.al/2021/02/22/cache-busting-in-node.js-dynamic-esm-imports/
const importFresh = async (modulePath: string) => {
	const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
	return await import(cacheBustingModulePath);
};

const generateJsonSchemaPath = path.join(
	import.meta.dirname,
	"../../build/generateJsonSchema.ts",
);

export const jsonSchema = (
	nodeEnv: "development" | "production" | "test",
	sport: Sport,
): RolldownPlugin => {
	return {
		name: "generate-json-schema",

		buildStart() {
			this.addWatchFile(generateJsonSchemaPath);
		},

		async generateBundle() {
			const { generateJsonSchema } = (await importFresh(
				generateJsonSchemaPath,
			)) as { generateJsonSchema: typeof generateJsonSchemaType };

			const schema = await generateJsonSchema(sport);

			this.emitFile({
				type: "asset",
				fileName: "../files/league-schema.json",
				source: JSON.stringify(
					schema,
					undefined,
					nodeEnv === "production" ? 2 : 0,
				),
			});
		},
	};
};
