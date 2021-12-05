import JSONParserText from "./JSONParserText";

describe("worker/api/JSONParserText", () => {
	it.skip("error on invalid trailing comma in object", () => {
		const parser = new JSONParserText(value => {
			console.log("value", value);
		});

		parser.write('{"a":1,}');
	});
});
