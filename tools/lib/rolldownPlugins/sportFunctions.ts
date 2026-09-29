import { statSync } from "node:fs";
import {
	RolldownMagicString,
	type Plugin,
	type TransformResult,
} from "rolldown";
import { parseAndWalk, type WalkerCallbackContext } from "oxc-walker";
import type {
	Node,
	ObjectExpression,
	ObjectProperty,
} from "@oxc-project/types";
import type { Sport } from "../getSport.ts";

// The purpose of this is to do dead code elimination (or allow the minifier to do it) by sport, without requiring ugly syntax like nested ternaries for handling multiple sports. Instead, we have this nicer bySport function.

// This is needed even in dev mode because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors.

// Handles quoted and unquoted keys, like {key: 1} vs {"key": 1}
const getObjectKey = (property: ObjectProperty): string => {
	if (property.key.type === "Identifier") {
		return property.key.name;
	}

	if (
		property.key.type === "Literal" &&
		typeof property.key.value === "string"
	) {
		return property.key.value;
	}

	throw new Error(`Unknown node type "${property.key.type}"`);
};

// Expression types that are always safe to splice into any surrounding position (as a call's
// callee, a member expression's object, at the start of a statement, etc.) without wrapping in
// parens. Anything not in this list gets wrapped - wrapping is always syntactically valid, so
// this errs on the side of over-parenthesizing rather than risk misparsing (e.g. an arrow
// function's body silently swallowing whatever comes after it).
const NEVER_NEEDS_PARENS = new Set([
	"Identifier",
	"ThisExpression",
	"Super",
	"Literal",
	"TemplateLiteral",
	"TaggedTemplateExpression",
	"MemberExpression",
	"CallExpression",
	"NewExpression",
	"ArrayExpression",
	"ChainExpression",
	"ParenthesizedExpression",
	"MetaProperty",
	"ImportExpression",
]);

// Positions (parent node type -> key within parent) that accept any AssignmentExpression-level expression, so a bySport value can be spliced in without parens. Avoiding unnecessary parens matters beyond aesthetics, because the minifier preserves parens around functions (they're a hint to V8 to eagerly compile the function).
const SAFE_POSITIONS: Record<string, string[]> = {
	ArrayExpression: ["elements"],
	AssignmentExpression: ["right"],
	AssignmentPattern: ["right"],
	CallExpression: ["arguments"],
	ConditionalExpression: ["consequent", "alternate"],
	JSXExpressionContainer: ["expression"],
	NewExpression: ["arguments"],
	ParenthesizedExpression: ["expression"],
	Property: ["value"],
	PropertyDefinition: ["value"],
	ReturnStatement: ["argument"],
	SpreadElement: ["argument"],
	TemplateLiteral: ["expressions"],
	VariableDeclarator: ["init"],
};

const needsParens = (
	value: Node,
	parent: Node | null,
	key: WalkerCallbackContext["key"],
) => {
	if (NEVER_NEEDS_PARENS.has(value.type)) {
		return false;
	}

	// Would be ambiguous with multiple arguments/elements/etc, if it wasn't already wrapped in a ParenthesizedExpression
	if (value.type === "SequenceExpression") {
		return true;
	}

	if (parent && typeof key === "string") {
		return !SAFE_POSITIONS[parent.type]?.includes(key);
	}

	return true;
};

export const sportFunctions = (
	nodeEnv: "development" | "production" | "test",
	sport: Sport,
): Plugin => {
	const compileCache: Record<
		string,
		{
			mtimeMs: number;
			result: TransformResult;
		}
	> = {};

	const processCode = (
		code: string,
		id: string,
		magicString: RolldownMagicString,
	) => {
		parseAndWalk(code, id, {
			// Use `leave` (post-order) rather than `enter`, so nested bySport calls (e.g. inside a bySport value) are already resolved before their parent is handled.
			leave(node, parent, { key }) {
				if (node.type !== "CallExpression") {
					return;
				}
				if (node.callee.type !== "Identifier") {
					return;
				}

				if (node.callee.name === "bySport") {
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
					// Also supports a "default" property, used for any non-matching sport.

					const argument = node.arguments[0];
					if (argument?.type !== "ObjectExpression") {
						throw new Error(
							`Unexpected bySport argument type "${argument?.type}"`,
						);
					}

					const propertiesByKey: Record<string, ObjectProperty> = {};
					for (const property of (argument as ObjectExpression).properties) {
						if (property.type !== "Property") {
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

					const raw = magicString.slice(value.start, value.end);
					const replacement = needsParens(value, parent, key)
						? `(${raw})`
						: raw;
					magicString.overwrite(node.start, node.end, replacement);
				}
			},
		});
	};

	return {
		name: "sport-functions",
		transform: {
			filter: {
				moduleType: ["ts", "tsx"],
				code: "bySport",
			},
			handler(code, id, meta) {
				// meta.magicString is only provided by Rolldown with experimental.nativeMagicString enabled. Vite's dev plugin container (used by Vitest) doesn't provide it, so create one ourselves in that case.
				const isNative = meta.magicString !== undefined;
				const magicString = meta.magicString ?? new RolldownMagicString(code);

				if (nodeEnv === "development") {
					const { mtimeMs } = statSync(id);
					const cached = compileCache[id];
					if (cached?.mtimeMs === mtimeMs) {
						return cached.result;
					} else {
						processCode(code, id, magicString);
						const result = {
							code: magicString.toString(),
							map: magicString.generateMap({ hires: true }).toString(),
						};
						compileCache[id] = {
							mtimeMs,
							result,
						};
						return result;
					}
				} else {
					processCode(code, id, magicString);
					if (isNative) {
						return { code: magicString };
					}
					return {
						code: magicString.toString(),
						map: magicString.generateMap({ hires: true }).toString(),
					};
				}
			},
		},
	};
};
