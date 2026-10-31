import { statSync } from "node:fs";
import { transformSync } from "@babel/core";
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import babelPluginSyntaxJsx from "@babel/plugin-syntax-jsx";
import type { RolldownPlugin, SourceMapInput, TransformResult } from "rolldown";
import { babelPluginSportFunctionsFactory } from "../../babel-plugin-sport-functions/index.ts";
import type { Sport } from "../getSport.ts";

// Use babel to run babel-plugin-sport-functions. This is needed even in dev mode because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors.
export const sportFunctions = (
	nodeEnv: "development" | "production" | "test",
	sport: Sport,
) => {
	const compileCache: Record<
		string,
		{
			mtimeMs: number;
			result: TransformResult;
		}
	> = {};

	const babelPluginSportFunctions = babelPluginSportFunctionsFactory(sport);

	const compile = (code: string, moduleType: string): TransformResult => {
		const isTsx = moduleType === "tsx";

		const babelResult = transformSync(code, {
			babelrc: false,
			configFile: false,
			sourceMaps: true,
			plugins: [
				babelPluginSyntaxTypescript,
				...(isTsx ? [babelPluginSyntaxJsx] : []),
				babelPluginSportFunctions,
			],
		});

		return {
			code: babelResult!.code!,
			map: babelResult!.map as SourceMapInput,
		};
	};

	return {
		name: "sport-functions",
		transform: {
			filter: {
				moduleType: ["ts", "tsx"],
				code: "bySport",
			},
			handler(
				code: string,
				id: string,
				{ moduleType }: { moduleType: string },
			) {
				if (nodeEnv === "development") {
					const { mtimeMs } = statSync(id);
					const cached = compileCache[id];
					if (cached?.mtimeMs === mtimeMs) {
						return cached.result;
					} else {
						const result = compile(code, moduleType);
						compileCache[id] = {
							mtimeMs,
							result,
						};
						return result;
					}
				} else {
					return compile(code, moduleType);
				}
			},
		},
	} satisfies RolldownPlugin;
};
