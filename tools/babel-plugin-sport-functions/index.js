// The purpose of this is to do dead code elimination (or allow the minifier to do it) by sport (defined in process.env.SPORT), without requiring ugly syntax like nested ternaries for handling multiple sports. Instead, we have these nicer isSport and bySport functions.
//
// Based on https://github.com/4Catalyzer/babel-plugin-dev-expression/blob/293b8716d3df93b3c5fb23cf3181c8bb296ec449/dev-expression.js

"use strict";

// Better than tools/lib/getSport.ts because it's not TypeScript (can't import this everywhere in TS yet) and it's slightly faster (no validation, since we can assume that is done elsewhere)
const getSport = () => process.env.SPORT ?? "basketball";

// Handles quoted and unquoted keys, like {key: 1} vs {"key": 1}
const getObjectKey = (property) => {
	if (property.key.type === "Identifier") {
		return property.key.name;
	}

	if (property.key.type === "StringLiteral") {
		return property.key.value;
	}

	throw new Error(`Unknown node type "${property.key.type}"`);
};

// To define types some day: https://github.com/babel/babel/issues/10637
export const babelPluginSportFunctions = (babel) => {
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

						const localSport = path.node.arguments[0].value;
						const value = t.booleanLiteral(localSport === getSport());
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

						const sport = getSport();

						const properties = path.node.arguments[0].properties;
						const propertiesByKey = {};
						for (const property of properties) {
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
