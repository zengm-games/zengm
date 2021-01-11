// The only purpose of this is to allow the minifier to do dead code elimination, which it can do for `if (true) {}` but
// not for `if (function_that_returns_true()) {}`. This allows for multiple sports in the same codebase, without multiple
// sports in every bundle, and without writing by hand messy long ternaries that the minifier can understand.
//
// Based on https://github.com/4Catalyzer/babel-plugin-dev-expression/blob/293b8716d3df93b3c5fb23cf3181c8bb296ec449/dev-expression.js

"use strict";

module.exports = function (babel) {
	var t = babel.types;

	var PROCESS_ENV_SPORT = t.memberExpression(
		t.memberExpression(t.identifier("process"), t.identifier("env")),
		t.identifier("SPORT"),
	);

	const getObjectKey = property => {
		if (property.key.type === "Identifier") {
			return t.stringLiteral(property.key.name);
		}

		if (property.key.type === "StringLiteral") {
			return t.stringLiteral(property.key.value);
		}

		throw new Error(`Unknown node type "${property.key.type}"`);
	};

	return {
		visitor: {
			CallExpression: {
				exit: function (path) {
					var node = path.node;

					if (path.get("callee").isIdentifier({ name: "isSport" })) {
						// Turns this code:
						//
						// isSport("basketball");
						//
						// into this:
						//
						// process.env.SPORT === "basketball"

						var sport = node.arguments[0];
						path.replaceWith(
							t.binaryExpression("===", PROCESS_ENV_SPORT, sport),
						);
					} else if (path.get("callee").isIdentifier({ name: "bySport" })) {
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
						// const whatever = process.env.SPORT === "basketball"
						//     ? "basketball thing"
						//     : process.env.SPORT === "football"
						//     ? "football thing"
						//     : "hockey thing";
						//
						// And this:
						//
						// const whatever = bySport({
						//     basketball: "basketball thing",
						//     default: "default thing",
						// });
						//
						// into this:
						//
						// const whatever = process.env.SPORT === "basketball"
						//     ? "basketball thing"
						//     : "default thing";

						const properties = node.arguments[0].properties;
						const sportProperties = properties
							.filter(property => property.key.name !== "default")
							.reverse();
						const defaultProperty = properties.find(
							property => property.key.name === "default",
						);

						if (sportProperties.length === 0) {
							throw new Error("Must have at least one sport in bySport");
						}

						let bigTernary = defaultProperty
							? t.conditionalExpression(
									t.binaryExpression(
										"===",
										PROCESS_ENV_SPORT,
										getObjectKey(sportProperties[0]),
									),
									sportProperties[0].value,
									defaultProperty.value,
							  )
							: sportProperties[0].value;

						// Wrap other sports around the first
						for (let i = 1; i < sportProperties.length; i++) {
							bigTernary = t.conditionalExpression(
								t.binaryExpression(
									"===",
									PROCESS_ENV_SPORT,
									getObjectKey(sportProperties[i]),
								),
								sportProperties[i].value,
								bigTernary,
							);
						}

						path.replaceWith(bigTernary);
					}
				},
			},
		},
	};
};
