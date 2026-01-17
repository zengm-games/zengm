import fs from "node:fs/promises";
import { generateJsonSchema } from "./generateJsonSchema.ts";

export const createJsonSchemaFile = async (
	sport: Parameters<typeof generateJsonSchema>[0],
) => {
	const jsonSchema = generateJsonSchema(sport);
	await fs.mkdir("build/files", { recursive: true });
	await fs.writeFile(
		"build/files/league-schema.json",
		JSON.stringify(jsonSchema, null, 2),
	);
};
