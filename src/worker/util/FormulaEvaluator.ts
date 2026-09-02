/**
 * Based on https://github.com/Aterbonus/AterCalculator
 *
 * Copyright (c) 2016 Gustavo Alfredo Marín Sáez
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import helpers from "./helpers.ts";

const BINARY_MINUS = "-";
const UNARY_MINUS = "#";
const FUNCTION_PREFIX = "@";
const PROPERTY_PREFIX = ".";

const regexEncode = (string: string) => {
	// eslint-disable-next-line no-useless-escape
	return string.replace(/[$()*+./?[\\\]^{|}\-]/g, String.raw`\$&`);
};

const regexSort = (a: string, b: string) => {
	return a.length - b.length;
};

type UnaryOperator = {
	operands: 1;
	precedence: number;
	associativity: "l" | "r";
	func: (a: number) => number;
};

type BinaryOperator = {
	operands: 2;
	precedence: number;
	associativity: "l" | "r";
	func: (a: number, b: number) => number;
};

type Operator = UnaryOperator | BinaryOperator;

const operators: Record<string, Operator> = {
	"+": {
		operands: 2,
		precedence: 1,
		associativity: "l",
		func: (a, b) => a + b,
	},
	"-": {
		operands: 2,
		precedence: 1,
		associativity: "l",
		func: (a, b) => a - b,
	},
	"*": {
		operands: 2,
		precedence: 2,
		associativity: "l",
		func: (a, b) => a * b,
	},
	"/": {
		operands: 2,
		precedence: 2,
		associativity: "l",
		func: (a, b) => a / b,
	},
	"^": {
		operands: 2,
		precedence: 4,
		associativity: "r",
		func: (a, b) => a ** b,
	},
	"#": {
		operands: 1,
		precedence: 3,
		associativity: "r",
		func: (a) => -a,
	},
};

type FormulaFunction = {
	arity: number;
	func: (...params: number[]) => number;
};

const functions: Record<string, FormulaFunction> = {
	abs: {
		arity: 1,
		func: Math.abs,
	},
	max: {
		arity: 2,
		func: Math.max,
	},
	min: {
		arity: 2,
		func: Math.min,
	},
};

const operatorsString = Object.keys(operators)
	.map(regexEncode)
	.sort(regexSort)
	.join("|");

type ParsedVariable =
	| {
			type: "variable";
			name: string;
	  }
	| {
			type: "nestedVariable";
			name: string;
			property: string;
	  };

const parseVariable = (token: string): ParsedVariable => {
	const dotIndex = token.indexOf(PROPERTY_PREFIX);

	if (dotIndex === -1) {
		return {
			type: "variable",
			name: token,
		};
	}

	return {
		type: "nestedVariable",
		name: token.slice(0, dotIndex),
		property: token.slice(dotIndex + 1),
	};
};

const parseUnaryMinus = (string: string) => {
	return string
		.replace(/\s/g, "")
		.replaceAll(BINARY_MINUS, (match, offset, string) => {
			if (offset === 0) {
				return UNARY_MINUS;
			}
			const prevChar = string[offset - 1];
			return !!operators[prevChar] || prevChar === "("
				? UNARY_MINUS
				: BINARY_MINUS;
		});
};

const shuntingYard = (string: string) => {
	const tokens = string.match(
		new RegExp(
			// A number must start with a digit and contain only characters
			// that can actually be part of a number. Variables can also
			// contain digits, including at the beginning.
			String.raw`\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?![a-zA-Z\d])` +
				// Property access, such as x.y
				String.raw`|[a-zA-Z\d]+(?:\.[a-zA-Z\d]+)?` +
				String.raw`|[(),]` +
				String.raw`|${operatorsString}`,
			"g",
		),
	);

	let aux;
	const stack: string[] = [];
	const output: string[] = [];

	if (tokens) {
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]!;
			const nextToken = tokens[i + 1];

			if (token === ",") {
				while (stack.length > 0 && stack.at(-1) !== "(") {
					output.push(stack.pop()!);
				}
				if (stack.length === 0) {
					throw new Error(
						"A separator (,) was misplaced or parentheses were mismatched",
					);
				}
			} else if (functions[token] !== undefined && nextToken === "(") {
				// Keep the function on the stack until its closing parenthesis.
				stack.push(`${FUNCTION_PREFIX}${token}`);
			} else if (operators[token]) {
				const operator = operators[token];
				while (
					operators[stack.at(-1)!] !== undefined &&
					((operator.associativity === "l" &&
						operator.precedence <= operators[stack.at(-1)!]!.precedence) ||
						(operator.associativity === "r" &&
							operator.precedence < operators[stack.at(-1)!]!.precedence))
				) {
					output.push(stack.pop()!);
				}
				stack.push(token);
			} else if (token === "(") {
				stack.push(token);
			} else if (token === ")") {
				while ((aux = stack.pop()) !== "(" && aux !== undefined) {
					output.push(aux);
				}
				if (aux !== "(") {
					throw new Error("Mismatched parentheses");
				}

				// If this parenthesized expression was a function call,
				// emit the function after its arguments.
				if (stack.at(-1)?.startsWith(FUNCTION_PREFIX)) {
					output.push(stack.pop()!);
				}
			} else {
				output.push(token);
			}
		}

		while ((aux = stack.pop()) !== undefined) {
			if ("(" === aux || ")" === aux) {
				throw new Error("Mismatched parentheses");
			}

			output.push(aux);
		}
	}

	return output;
};

export class InvalidVariableError extends Error {
	public invalidVariables: string[];

	constructor(invalidVariables: string[]) {
		super(
			`Invalid ${helpers.plural("variable", invalidVariables.length)}: ${invalidVariables.join(", ")}`,
		);
		this.invalidVariables = invalidVariables;
	}
}

type VariableValue = number | Record<string, number>;

type Token =
	| { type: "number"; value: number }
	| { type: "operator"; value: string }
	| { type: "function"; name: string }
	| ParsedVariable;

export class FormulaEvaluator<
	Variables extends ReadonlyArray<string>,
	NestedVariables extends Variables[number][],
> {
	private variables: Set<Variables[number]>;
	private nestedVariables: Set<Variables[number]>;
	private tokens: Token[];
	public usedVariables = new Set<Variables[number]>();
	private usedNestedVariables = new Set<Variables[number]>();

	constructor(
		equation: string,
		variables: Variables,
		nestedVariables: NestedVariables,
	) {
		this.variables = new Set(variables);
		this.nestedVariables = new Set(nestedVariables);
		this.tokens = this.partiallyEvaluate(
			shuntingYard(parseUnaryMinus(equation)),
		);

		if (this.tokens.length === 0) {
			throw new Error("Formula cannot be empty");
		}

		// Test with dummy values for variables, to hopefully ensure that this.evaluate never throws
		const dummyValues: Record<string, VariableValue> = {};
		for (const variable of this.usedVariables) {
			dummyValues[variable] = 0;
		}
		for (const variable of this.usedNestedVariables) {
			// Overwrite 0
			dummyValues[variable] = {};
		}
		this.evaluate(dummyValues);
	}

	private partiallyEvaluate(tokens: string[]) {
		const processed: Token[] = [];

		const invalidTokens = new Set<string>();

		for (const token of tokens) {
			const variable = parseVariable(token);

			if (this.variables.has(variable.name)) {
				const shouldBeNested = this.nestedVariables.has(variable.name);
				const nested = variable.type === "nestedVariable";

				if (nested && !shouldBeNested) {
					throw new Error(
						`Cannot use variable "${variable.name}" with nesting (like "${variable.name}.foo")`,
					);
				}

				if (!nested && shouldBeNested) {
					throw new Error(
						`Cannot use variable "${variable.name}" without nesting (like "${variable.name}.foo")`,
					);
				}

				this.usedVariables.add(variable.name);

				if (nested) {
					this.usedNestedVariables.add(variable.name);
				}

				processed.push(variable);
			} else if (operators[token] !== undefined) {
				processed.push({ type: "operator", value: token });
			} else if (
				token.startsWith(FUNCTION_PREFIX) &&
				functions[token.slice(FUNCTION_PREFIX.length)] !== undefined
			) {
				processed.push({
					type: "function",
					name: token.slice(FUNCTION_PREFIX.length),
				});
			} else {
				const float = helpers.localeParseFloat(token);
				if (Number.isNaN(float)) {
					invalidTokens.add(token);
				}
				processed.push({ type: "number", value: float });
			}
		}

		if (invalidTokens.size > 0) {
			throw new InvalidVariableError(Array.from(invalidTokens));
		}

		return processed;
	}

	evaluate(variables: Record<Variables[number], VariableValue>) {
		const stack: number[] = [];

		for (const token of this.tokens) {
			if (token.type === "operator") {
				const operator = operators[token.value]!;
				if (stack.length < operator.operands) {
					throw new Error("Insufficient values in the expression");
				}

				if (operator.operands === 1) {
					stack.push(operator.func(stack.pop() ?? 0));
				} else {
					const b = stack.pop() ?? 0;
					const a = stack.pop() ?? 0;
					stack.push(operator.func(a, b));
				}
			} else if (token.type === "function") {
				const func = functions[token.name]!;

				if (stack.length < func.arity) {
					throw new Error(
						`${token.name} requires exactly ${func.arity} ${helpers.plural("parameter", func.arity)}`,
					);
				}

				const params = [];
				while (params.length < func.arity) {
					params.push(stack.pop() ?? 0);
				}
				stack.push(func.func(...params));
			} else if (token.type === "number") {
				stack.push(token.value);
			} else {
				let value;
				if (token.type === "variable") {
					value = (variables as any)[token.name];
				} else {
					const object = (variables as any)[token.name];

					if (typeof object !== "object" || object === null) {
						throw new Error(
							`Variable "${token.name}" must be an object to access property "${token.property}"`,
						);
					}

					value = object[token.property];
				}

				// ?? 0 is needed for historical seasons where some stats don't exist and are undefined
				const value2 = value ?? 0;

				if (typeof value2 !== "number") {
					throw new Error(`Variable "${token.name}" must be a number`);
				}

				stack.push(value2);
			}
		}

		// Would be nice to explicitly track functions so we know which one it is...
		if (stack.length !== 1) {
			throw new Error("Invalid expression: too many values");
		}

		return stack.pop()!;
	}
}
