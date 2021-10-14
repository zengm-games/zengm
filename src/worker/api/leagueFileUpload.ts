import JSONParserText from "./JSONParserText";

// These objects (at the root of a league file) should be emitted as a complete object, rather than individual rows from an array
const CUMULATIVE_OBJECTS = new Set([
	"gameAttributes",
	"startingSeason",
	"version",
]);

const parseJSON = () => {
	let parser: any;

	const transformStream = new TransformStream({
		start(controller) {
			parser = new JSONParserText();

			// Adapted from JSONStream
			parser.onValue = (value: unknown) => {
				// The key on the root of the object is in the stack if we're nested, or is just parser.key if we're not
				let objectType;
				if (parser.stack.length > 1) {
					objectType = parser.stack[1].key;
				} else {
					objectType = parser.key;
				}

				const emitAtStackLength = CUMULATIVE_OBJECTS.has(objectType) ? 1 : 2;

				if (parser.stack.length !== emitAtStackLength) {
					// We must be deeper in the tree, still building an object to emit
					return;
				}

				controller.enqueue({
					key: objectType,
					value,
				});

				// Now that we have emitted the object we want, we no longer need to keep track of all the values on the stack. This avoids keeping the whole JSON object in memory.
				for (const row of parser.stack) {
					row.value = undefined;
				}
			};
		},

		transform(chunk) {
			parser.write(chunk);
		},
	});

	return transformStream;
};

const getBasicInfo = async (stream: ReadableStream) => {
	const basicInfo: any = {};

	// Keep in sync with NewLeagueTeam
	const BASIC_TEAM_KEYS = [
		"tid",
		"region",
		"name",
		"abbrev",
		"stadiumCapacity",
		"imgURL",
		"imgURLSmall",
		"colors",
		"srID",
		"disabled",
		"jersey",
		"cid",
		"did",
	];

	const reader = await stream.pipeThrough(parseJSON()).getReader();

	while (true) {
		const { value, done } = (await reader.read()) as any;
		if (done) {
			break;
		}

		if (CUMULATIVE_OBJECTS.has(value.key)) {
			basicInfo[value.key] = value.value;
		} else if (value.key === "teams") {
			if (!basicInfo.teams) {
				basicInfo.teams = [];
			}

			const t: any = {};
			for (const key of BASIC_TEAM_KEYS) {
				if (value.value[key] !== undefined) {
					t[key] = value.value[key];
				}
			}

			basicInfo.teams.push(t);
		} else {
			if (!basicInfo[value.key]) {
				basicInfo[value.key] = [];
			}
		}
	}

	return basicInfo;
};

const initialCheck = async (file: File) => {
	console.time("initialCheck");
	const stream = file.stream() as unknown as ReadableStream;
	console.timeLog("initialCheck");

	const stream2 = stream.pipeThrough(new TextDecoderStream());
	console.timeLog("initialCheck");
	const basicInfo = await getBasicInfo(stream2);
	console.timeLog("initialCheck");

	console.log("basicInfo", basicInfo);
	return basicInfo;
};

export default {
	initialCheck,
};
