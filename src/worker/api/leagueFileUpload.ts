import Ajv, { ValidateFunction } from "ajv";
import JSONParserText from "./JSONParserText";

// This is dynamically resolved with rollup-plugin-alias
// @ts-ignore
import schema from "league-schema"; // eslint-disable-line
import { helpers, toPolyfillReadable, toPolyfillTransform } from "../util";

// These objects (at the root of a league file) should be emitted as a complete object, rather than individual rows from an array
export const CUMULATIVE_OBJECTS = new Set([
	"gameAttributes",
	"meta",
	"startingSeason",
	"version",
]);

export const parseJSON = () => {
	let parser: any;

	const transformStream = new TransformStream({
		start(controller) {
			parser = new JSONParserText(value => {
				// This function was adapted from JSONStream, particularly the part where row.value is set to undefind at the bottom, that is important!

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
			});
		},

		transform(chunk) {
			parser.write(chunk);
		},
	});

	return transformStream;
};

// We have one big JSON Schema file for everything, but we need to run it on individual objects as they stream though. So break it up into parts.
const makeValidators = () => {
	const ajv = new Ajv({
		allErrors: true,
		code: { es5: true },
		verbose: true,
	});

	const validators: Record<string, ValidateFunction> = {};

	const baseSchema = {
		$schema: schema.$schema,
		$id: schema.$id,

		// Used in some parts
		definitions: schema.definitions,

		// These don't matter
		title: "",
		description: "",
	};

	const parts = helpers.keys(schema.properties);

	for (const part of parts) {
		const cumulative = CUMULATIVE_OBJECTS.has(part);

		const subset = cumulative
			? schema.properties[part]
			: (schema.properties[part] as any).items;

		const partSchema = {
			...baseSchema,
			$id: `${baseSchema.$id}#${part}`,
			...subset,
		};
		validators[part] = ajv.compile(partSchema);
	}

	return validators;
};

let validators: ReturnType<typeof makeValidators> | undefined;

export type BasicInfo = {
	gameAttributes?: any;
	meta?: any;
	startingSeason?: number;
	version?: number;
	teams?: any[];
	players?: any[]; // Only with includePlayersInBasicInfo
	keys: Set<string>;
	maxGid: number;
	hasRookieContracts: boolean;
};

const getBasicInfo = async (
	stream: ReadableStream,
	includePlayersInBasicInfo: boolean | undefined,
) => {
	// This is stuff needed for either the league creation screen, or is needed before actually loading the file to the database in createStream
	const basicInfo: BasicInfo = {
		keys: new Set(),
		maxGid: -1,
		hasRookieContracts: false,
	};

	if (!validators) {
		validators = makeValidators();
	}

	const schemaErrors = [];

	const reader = await stream.pipeThrough(parseJSON()).getReader();

	while (true) {
		const { value, done } = (await reader.read()) as any;
		if (done) {
			break;
		}

		const cumulative = CUMULATIVE_OBJECTS.has(value.key);

		basicInfo.keys.add(value.key);

		if (validators[value.key]) {
			const validate = validators[value.key];
			validate(value.value);
			if (validate.errors) {
				schemaErrors.push(...validate.errors);
			}
		}

		// Need to store max gid from games, so generated schedule does not overwrite it
		if (value.key === "games" && value.value.gid > basicInfo.maxGid) {
			basicInfo.maxGid = value.value.gid;
		}

		if (value.key === "players" && value.value.contract?.rookie) {
			basicInfo.hasRookieContracts = true;
		}

		if (cumulative) {
			(basicInfo as any)[value.key] = value.value;
		} else if (value.key === "teams") {
			if (!basicInfo.teams) {
				basicInfo.teams = [];
			}

			const t = {
				...value.value,
			};

			if (!t.colors) {
				t.colors = ["#000000", "#cccccc", "#ffffff"];
			}

			if (t.seasons?.length > 0) {
				// If specified on season, copy to root
				const maybeOnSeason = ["pop", "stadiumCapacity"] as const;
				const ts = t.seasons.at(-1);
				for (const prop of maybeOnSeason) {
					if (ts[prop] !== undefined) {
						t[prop] = ts[prop];
					}
				}
			}

			// stats and seasons take up a lot of space, so we don't need to keep them. But... heck, why not.

			basicInfo.teams.push(value.value);
		} else if (includePlayersInBasicInfo && value.key === "players") {
			if (!basicInfo.players) {
				basicInfo.players = [];
			}
			basicInfo.players.push(value.value);
		}
	}

	return { basicInfo, schemaErrors };
};

const initialCheck = async (
	file: File | string,
	includePlayersInBasicInfo: boolean | undefined,
) => {
	let stream: ReadableStream;
	if (typeof file === "string") {
		let response;
		try {
			response = await fetch(file);
		} catch (error) {
			throw new Error(
				"Could be a network error, an invalid URL, or an invalid Access-Control-Allow-Origin header",
			);
		}

		stream = response.body as unknown as ReadableStream;
	} else {
		stream = file.stream() as unknown as ReadableStream;
	}

	const stream2 = toPolyfillReadable(stream).pipeThrough(
		toPolyfillTransform(new TextDecoderStream()),
	);
	const { basicInfo, schemaErrors } = await getBasicInfo(
		stream2,
		includePlayersInBasicInfo,
	);

	return {
		basicInfo,
		schemaErrors,
	};
};

export default {
	initialCheck,
};
