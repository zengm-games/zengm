import { test } from "vitest";

import JSONParserText from "./JSONParserText";

test.skip("error on invalid trailing comma in object", () => {
	const parser = new JSONParserText(value => {
		console.log("value", value);
	});

	parser.write('{"a":1,}');
});
