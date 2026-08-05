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

import { isSport } from "../../common/sportFunctions.ts";
import helpers from "./helpers.ts";

const BINARY_MINUS = "-";
const UNARY_MINUS = "#";

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
		func: (a, b) => Math.pow(a, b),
	},
	"#": {
		operands: 1,
		precedence: 3,
		associativity: "r",
		func: (a) => -a,
	},
};

const operatorsString = Object.keys(operators)
	.map(regexEncode)
	.sort(regexSort)
	.join("|");

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
			String.raw`\d+(?:[\.]\d+)?(?:[eE]\d+)?|[()]` +
				String.raw`|${operatorsString}|[a-zA-Z\d]+`,
			"g",
		),
	);

	let aux;
	const stack: string[] = [];
	const output: string[] = [];

	if (tokens) {
		for (const token of tokens) {
			if (token === ",") {
				while (stack.length > 0 && stack.at(-1) !== "(") {
					output.push(stack.pop()!);
				}
				if (stack.length === 0) {
					throw new Error(
						"A separator (,) was misplaced or parentheses were mismatched",
					);
				}
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

	// Hack for 2b and 3b in baseball
	if (isSport("baseball")) {
		const output2 = [];
		for (let i = 0; i < output.length; i++) {
			if (
				(output[i] === "2" || output[i] === "3") &&
				output[i + 1]?.startsWith("b")
			) {
				output2.push(`${output[i]}${output[i + 1]}`);
				i += 1;
			} else {
				output2.push(output[i]!);
			}
		}
		return output2;
	}

	return output;
};

class FormulaEvaluator<Symbols extends ReadonlyArray<string>> {
	private symbols: Set<Symbols[number]>;
	private tokens: (string | number)[];

	constructor(equation: string, symbols: Symbols) {
		this.symbols = new Set(symbols);
		this.tokens = this.partiallyEvaluate(
			shuntingYard(parseUnaryMinus(equation)),
		);

		if (this.tokens.length === 0) {
			throw new Error("Formula cannot be empty");
		}
	}

	private partiallyEvaluate(tokens: string[]) {
		const processed: (string | number)[] = [];

		for (const token of tokens) {
			if (this.symbols.has(token)) {
				processed.push(token);
			} else if (operators[token] !== undefined) {
				processed.push(token);
			} else {
				const float = helpers.localeParseFloat(token);
				if (Number.isNaN(float)) {
					throw new Error(`Invalid variable "${token}"`);
				}
				processed.push(float);
			}
		}

		return processed;
	}

	evaluate(symbols: Record<Symbols[number], number>) {
		const stack: number[] = [];

		for (const token of this.tokens) {
			const operator = operators[token];
			if (operator !== undefined) {
				if (stack.length < operator.operands) {
					throw new Error("Insufficient values in the expression");
				}

				// ?? 0 is needed for historical seasons where some stats don't exist and are undefined
				if (operator.operands === 1) {
					stack.push(operator.func(stack.pop()! ?? 0));
				} else {
					const b = stack.pop()! ?? 0;
					const a = stack.pop()! ?? 0;
					stack.push(operator.func(a, b));
				}
			} else if (typeof token === "number") {
				stack.push(token);
			} else {
				stack.push((symbols as any)[token]);
			}
		}
		if (stack.length !== 1) {
			throw new Error("Too many values in the expression");
		}

		return stack.pop()!;
	}
}

export default FormulaEvaluator;
