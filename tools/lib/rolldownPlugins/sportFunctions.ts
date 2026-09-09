import fs from "node:fs/promises";
import { transformAsync } from "@babel/core";
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import babelPluginSyntaxJsx from "@babel/plugin-syntax-jsx";
import type { RolldownPlugin, SourceMapInput, TransformResult } from "rolldown";
import { babelPluginSportFunctionsFactory } from "../../babel-plugin-sport-functions/index.ts";
import type { Sport } from "../getSport.ts";

// Use babel to run babel-plugin-sport-functions. This is needed even in dev mode because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors. It's not actually needed for isSport in dev mode.
export const sportFunctions = (
	nodeEnv: "development" | "production" | "test",
	sport: Sport,
) => {
	const babelCache: Record<
		string,
		{
			mtimeMs: number;
			result: TransformResult;
		}
	> = {};

	const babelPluginSportFunctions = babelPluginSportFunctionsFactory(sport);

	return {
		name: "sport-functions",
		transform: {
			filter: {
				moduleType: ["ts", "tsx"],
				code: ["bySport", "isSport"],
			},
			async handler(
				code: string,
				id: string,
				{ moduleType }: { moduleType: string },
			) {
				let mtimeMs;
				if (nodeEnv === "development") {
					mtimeMs = (await fs.stat(id)).mtimeMs;
					const cached = babelCache[id];
					if (cached?.mtimeMs === mtimeMs) {
						return cached.result;
					}
				}

				const isTsx = moduleType === "tsx";

				const babelResult = await transformAsync(code, {
					babelrc: false,
					configFile: false,
					sourceMaps: true,
					plugins: [
						babelPluginSyntaxTypescript,
						...(isTsx ? [babelPluginSyntaxJsx] : []),
						babelPluginSportFunctions,
					],
				});

				const result = {
					code: babelResult!.code!,
					map: babelResult!.map as SourceMapInput,
				};

				if (nodeEnv === "development") {
					babelCache[id] = {
						mtimeMs: mtimeMs!,
						result,
					};
				}

				return result;
			},
		},
	} satisfies RolldownPlugin;
};
