// https://github.com/babel/babel/issues/10637#issuecomment-882101248
import type * as BabelCoreNamespace from "@babel/core";
import type { PluginObj } from "@babel/core";
import type { Sport } from "../lib/getSport.ts";

type Babel = typeof BabelCoreNamespace;
type ObjectProperty = BabelCoreNamespace.types.ObjectProperty;

// The purpose of this is to do dead code elimination (or allow the minifier to do it) by sport, without requiring ugly syntax like nested ternaries for handling multiple sports. Instead, we have these nicer isSport and bySport functions.
//
// Based on https://github.com/4Catalyzer/babel-plugin-dev-expression/blob/293b8716d3df93b3c5fb23cf3181c8bb296ec449/dev-expression.js

// Handles quoted and unquoted keys, like {key: 1} vs {"key": 1}
const getObjectKey = (property: ObjectProperty) => {
	if (property.key.type === "Identifier") {
		return property.key.name;
	}

	if (property.key.type === "StringLiteral") {
		return property.key.value;
	}

	throw new Error(`Unknown node type "${property.key.type}"`);
};

export const babelPluginSportFunctions = (
	babel: Babel,
	{
		sport,
	}: {
		sport: Sport;
	},
): PluginObj => {
	const t = babel.types;

	return {
		visitor: {
			CallExpression: {
				exit(path) {
					const callee = path.get("callee");

					if (callee.isIdentifier({ name: "isSport" })) {
						// Turns this code:
						//
						// isSport("basketball");
						//
						// into either true or false, depending on if the current sport is basketball or not.

						const argument = path.node.arguments[0];
						if (argument?.type !== "StringLiteral") {
							throw new Error(
								`Unexpected isSport argument type "${argument?.type}"`,
							);
						}

						const localSport = argument.value;
						const value = t.booleanLiteral(localSport === sport);
						path.replaceWith(value);
					} else if (callee.isIdentifier({ name: "bySport" })) {
						// Turns this code:
						//
						// const whatever = bySport({
						//     basketball: "basketball thing",
						//     football: "football thing",
						//     hockey: "hockey thing",
						// });
						//
						// into this:
						//
						// const whatever = "basketball thing";
						//
						// (Or football/hockey thing, if that is the current sport.)
						//
						// Also supports a "default" property:
						//
						// const whatever = bySport({
						//     basketball: "basketball thing",
						//     default: "default thing",
						// });
						//
						// So that outputs this for any non-basketball sport:
						//
						// const whatever = "default thing";

						const argument = path.node.arguments[0];
						if (argument?.type !== "ObjectExpression") {
							throw new Error(
								`Unexpected bySport argument type "${argument?.type}"`,
							);
						}

						const properties = argument.properties;
						const propertiesByKey: Record<string, ObjectProperty> = {};
						for (const property of properties) {
							if (property.type !== "ObjectProperty") {
								throw new Error(
									`Unexpected bySport property type "${property.type}"`,
								);
							}

							propertiesByKey[getObjectKey(property)] = property;
						}

						const value =
							propertiesByKey[sport]?.value ?? propertiesByKey.default?.value;

						if (value === undefined) {
							throw new Error(`Missing sport (${sport}) and default`);
						}

						path.replaceWith(value);
					}
				},
			},
		},
	};
};
