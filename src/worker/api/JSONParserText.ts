// This is based on https://github.com/qwtel/jsonparse/ but assumes the input is already a utf8 string, so it gets rid of a lot of complexity dealing with character encoding. It runs much faster too!

// Named constants with unique integer values
const C = {};
// Tokens
const LEFT_BRACE = (C.LEFT_BRACE = 0x1);
const RIGHT_BRACE = (C.RIGHT_BRACE = 0x2);
const LEFT_BRACKET = (C.LEFT_BRACKET = 0x3);
const RIGHT_BRACKET = (C.RIGHT_BRACKET = 0x4);
const COLON = (C.COLON = 0x5);
const COMMA = (C.COMMA = 0x6);
const TRUE = (C.TRUE = 0x7);
const FALSE = (C.FALSE = 0x8);
const NULL = (C.NULL = 0x9);
const STRING = (C.STRING = 0xa);
const NUMBER = (C.NUMBER = 0xb);
// Tokenizer States
const START = (C.START = 0x11);
const STOP = (C.STOP = 0x12);
const TRUE1 = (C.TRUE1 = 0x21);
const TRUE2 = (C.TRUE2 = 0x22);
const TRUE3 = (C.TRUE3 = 0x23);
const FALSE1 = (C.FALSE1 = 0x31);
const FALSE2 = (C.FALSE2 = 0x32);
const FALSE3 = (C.FALSE3 = 0x33);
const FALSE4 = (C.FALSE4 = 0x34);
const NULL1 = (C.NULL1 = 0x41);
const NULL2 = (C.NULL2 = 0x42);
const NULL3 = (C.NULL3 = 0x43);
const NUMBER1 = (C.NUMBER1 = 0x51);
const NUMBER3 = (C.NUMBER3 = 0x53);
const STRING1 = (C.STRING1 = 0x61);
const STRING2 = (C.STRING2 = 0x62);
// Parser States
const VALUE = (C.VALUE = 0x71);
const KEY = (C.KEY = 0x72);
// Parser Modes
const OBJECT = (C.OBJECT = 0x81);
const ARRAY = (C.ARRAY = 0x82);

class JSONParserText {
	string: string | undefined;
	tState: number;
	value: any;
	key: undefined | string | number;

	constructor() {
		this.tState = START;
		this.value = undefined;

		this.string = undefined; // string data

		this.key = undefined;
		this.mode = undefined;
		this.stack = [];
		this.state = VALUE;
	}

	// Slow code to string converter (only used when throwing syntax errors)
	static toknam(code) {
		const keys = Object.keys(C);
		for (let i = 0, l = keys.length; i < l; i++) {
			const key = keys[i];
			if (C[key] === code) {
				return key;
			}
		}
		return code && "0x" + code.toString(16);
	}

	charError(char: string, i: number) {
		this.tState = STOP;
		throw new Error(
			"Unexpected " +
				JSON.stringify(char[i]) +
				" at position " +
				i +
				" in state " +
				Parser.toknam(this.tState),
		);
	}
	write(text: string) {
		for (let i = 0, l = text.length; i < l; i++) {
			const n = text[i];
			if (this.tState === START) {
				if (n === "{") {
					this.onToken(LEFT_BRACE, "{");
				} else if (n === "}") {
					this.onToken(RIGHT_BRACE, "}");
				} else if (n === "[") {
					this.onToken(LEFT_BRACKET, "[");
				} else if (n === "]") {
					this.onToken(RIGHT_BRACKET, "]");
				} else if (n === ":") {
					this.onToken(COLON, ":");
				} else if (n === ",") {
					this.onToken(COMMA, ",");
				} else if (n === "t") {
					this.tState = TRUE1;
				} else if (n === "f") {
					this.tState = FALSE1;
				} else if (n === "n") {
					this.tState = NULL1;
				} else if (n === '"') {
					// "
					this.string = "";
					this.tState = STRING1;
				} else if (n === "-") {
					this.string = "-";
					this.tState = NUMBER1;
				} else {
					if (n >= "0" && n <= "9") {
						this.string = n;
						this.tState = NUMBER3;
					} else if (n === " " || n === "\t" || n === "\n" || n === "\r") {
						// whitespace
					} else {
						debugger;
						return this.charError(text, i);
					}
				}
			} else if (this.tState === STRING1) {
				if (n === '"') {
					this.tState = START;
					this.onToken(STRING, this.string);
					this.string = undefined;
				} else if (n === "\\") {
					this.tState = STRING2;
				} else {
					// Really should only be if n >= 0x20, anything less is error
					this.string += n;
				}
			} else if (this.tState === STRING2) {
				// After backslash
				if (n === '"') {
					this.string += '"';
					this.tState = STRING1;
				} else if (n === "\\") {
					this.string += "\\";
					this.tState = STRING1;
				} else if (n === "/") {
					this.string += "/";
					this.tState = STRING1;
				} else if (n === "b") {
					this.string += "\b";
					this.tState = STRING1;
				} else if (n === "f") {
					this.string += "\f";
					this.tState = STRING1;
				} else if (n === "n") {
					this.string += "\n";
					this.tState = STRING1;
				} else if (n === "r") {
					this.string += "\r";
					this.tState = STRING1;
				} else if (n === "t") {
					this.string += "\t";
					this.tState = STRING1;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === NUMBER1 || this.tState === NUMBER3) {
				switch (n) {
					case "0":
					case "1":
					case "2":
					case "3":
					case "4":
					case "5":
					case "6":
					case "7":
					case "8":
					case "9":
					case ".":
					case "e":
					case "E":
					case "+":
					case "-":
						this.string += n;
						this.tState = NUMBER3;
						break;
					default: {
						this.tState = START;
						const error = this.numberReviver(this.string);
						if (error) {
							return error;
						}

						this.string = undefined;

						// Process this character (n) again, to get the actual value
						i--;
						break;
					}
				}
			} else if (this.tState === TRUE1) {
				if (n === "r") {
					this.tState = TRUE2;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === TRUE2) {
				if (n === "u") {
					this.tState = TRUE3;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === TRUE3) {
				if (n === "e") {
					this.tState = START;
					this.onToken(TRUE, true);
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === FALSE1) {
				if (n === "a") {
					this.tState = FALSE2;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === FALSE2) {
				if (n === "l") {
					this.tState = FALSE3;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === FALSE3) {
				if (n === "s") {
					this.tState = FALSE4;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === FALSE4) {
				if (n === "e") {
					this.tState = START;
					this.onToken(FALSE, false);
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === NULL1) {
				if (n === "u") {
					this.tState = NULL2;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === NULL2) {
				if (n === "l") {
					this.tState = NULL3;
				} else {
					return this.charError(text, i);
				}
			} else if (this.tState === NULL3) {
				if (n === "l") {
					this.tState = START;
					this.onToken(NULL, null);
				} else {
					return this.charError(text, i);
				}
			}
		}
	}

	parseError(token, value) {
		this.tState = STOP;
		throw new Error(
			"Unexpected " +
				Parser.toknam(token) +
				(value ? "(" + JSON.stringify(value) + ")" : "") +
				" in state " +
				Parser.toknam(this.state),
		);
	}
	push() {
		this.stack.push({ value: this.value, key: this.key, mode: this.mode });
	}
	pop() {
		const value = this.value;
		const parent = this.stack.pop();
		this.value = parent.value;
		this.key = parent.key;
		this.mode = parent.mode;
		this.emit(value);
		if (!this.mode) {
			this.state = VALUE;
		}
	}
	emit(value: typeof this["value"]) {
		if (this.mode) {
			this.state = COMMA;
		}
		this.onValue(value);
	}
	onValue(value) {
		// Override me
	}
	onToken(token, value) {
		if (this.state === VALUE) {
			if (
				token === STRING ||
				token === NUMBER ||
				token === TRUE ||
				token === FALSE ||
				token === NULL
			) {
				if (this.value) {
					this.value[this.key] = value;
				}
				this.emit(value);
			} else if (token === LEFT_BRACE) {
				this.push();
				if (this.value) {
					this.value = this.value[this.key] = {};
				} else {
					this.value = {};
				}
				this.key = undefined;
				this.state = KEY;
				this.mode = OBJECT;
			} else if (token === LEFT_BRACKET) {
				this.push();
				if (this.value) {
					this.value = this.value[this.key] = [];
				} else {
					this.value = [];
				}
				this.key = 0;
				this.mode = ARRAY;
				this.state = VALUE;
			} else if (token === RIGHT_BRACE) {
				if (this.mode === OBJECT) {
					this.pop();
				} else {
					return this.parseError(token, value);
				}
			} else if (token === RIGHT_BRACKET) {
				if (this.mode === ARRAY) {
					this.pop();
				} else {
					return this.parseError(token, value);
				}
			} else {
				return this.parseError(token, value);
			}
		} else if (this.state === KEY) {
			if (token === STRING) {
				this.key = value;
				this.state = COLON;
			} else if (token === RIGHT_BRACE) {
				this.pop();
			} else {
				return this.parseError(token, value);
			}
		} else if (this.state === COLON) {
			if (token === COLON) {
				this.state = VALUE;
			} else {
				return this.parseError(token, value);
			}
		} else if (this.state === COMMA) {
			if (token === COMMA) {
				if (this.mode === ARRAY) {
					this.key++;
					this.state = VALUE;
				} else if (this.mode === OBJECT) {
					this.state = KEY;
				}
			} else if (
				(token === RIGHT_BRACKET && this.mode === ARRAY) ||
				(token === RIGHT_BRACE && this.mode === OBJECT)
			) {
				this.pop();
			} else {
				return this.parseError(token, value);
			}
		} else {
			return this.parseError(token, value);
		}
	}

	// Override to implement your own number reviver.
	// Any value returned is treated as error and will interrupt parsing.
	numberReviver(text: string) {
		const number = Number(text);

		if (isNaN(number)) {
			return this.charError(text, 0);
		}

		this.onToken(NUMBER, number);
	}
}

export default JSONParserText;
