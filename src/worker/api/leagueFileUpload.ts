import type { ValidateFunction } from "ajv";
// eslint-disable-next-line import/no-unresolved
import Ajv from "ajv-hack";
import JSONParserText from "./JSONParserText";

// This is dynamically resolved with rollup-plugin-alias
// @ts-ignore
import schema from "league-schema"; // eslint-disable-line
import { helpers, toUI } from "../util";
import { highWaterMark } from "../core/league/createStream";
import type { Conditions } from "../../common/types";
import {
	toPolyfillReadable,
	toPolyfillTransform,
} from "../util/polyfills-modern";

// These objects (at the root of a league file) should be emitted as a complete object, rather than individual rows from an array
export const CUMULATIVE_OBJECTS = new Set([
	"gameAttributes",
	"meta",
	"startingSeason",
	"version",
]);

export const parseJSON = () => {
	let parser: any;

	const transformStream = new TransformStream(
		{
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

					// Also, when processing an array/object, this.value will contain the current state of the array/object. So we should delete the value there too, but leave the array/object so it can still be used by the parser
					if (typeof parser.value === "object" && parser.value !== null) {
						delete parser.value[parser.key];
					}
				});
			},

			transform(chunk) {
				parser.write(chunk);
			},

			flush(controller) {
				controller.terminate();
			},
		},
		new CountQueuingStrategy({
			highWaterMark,
		}),
		new CountQueuingStrategy({
			highWaterMark,
		}),
	);

	return transformStream;
};

// We have one big JSON Schema file for everything, but we need to run it on individual objects as they stream though. So break it up into parts.
const makeValidators = () => {
	const ajv = new Ajv({
		allErrors: true,
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
	name?: string;
};

const getBasicInfo = async ({
	stream,
	includePlayersInBasicInfo,
	leagueCreationID,
	conditions,
}: {
	stream: ReadableStream;
	includePlayersInBasicInfo: boolean | undefined;
	leagueCreationID: number;
	conditions: Conditions;
}) => {
	// This is stuff needed for either the league creation screen, or is needed before actually loading the file to the database in createStream
	const basicInfo: BasicInfo = {
		keys: new Set(),
		maxGid: -1,
		hasRookieContracts: false,
	};

	if (includePlayersInBasicInfo) {
		basicInfo.players = [];
	}

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

		if (!basicInfo.keys.has(value.key)) {
			basicInfo.keys.add(value.key);
			toUI(
				"updateLocal",
				[
					{
						leagueCreation: {
							id: leagueCreationID,
							status: value.key,
						},
					},
				],
				conditions,
			);
		}

		if (validators[value.key]) {
			const validate = validators[value.key];
			validate(value.value);
			if (validate.errors) {
				schemaErrors.push(...validate.errors);
			}
		}

		if (value.key === "meta" && value.value.name) {
			basicInfo.name = value.value.name;
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
			basicInfo.players!.push(value.value);
		}
	}

	toUI(
		"updateLocal",
		[
			{
				leagueCreation: undefined,
			},
		],
		conditions,
	);

	return { basicInfo, schemaErrors };
};

export const emitProgressStream = (
	leagueCreationID: number,
	sizeInBytes: number | undefined,
	conditions: Conditions,
) => {
	const doIt = sizeInBytes !== undefined && !Number.isNaN(sizeInBytes);

	let lastPercentEmitted = 0;
	let sizeSoFar = 0;
	return new TransformStream({
		start() {
			toUI(
				"updateLocal",
				[
					{
						leagueCreationPercent: doIt
							? {
									id: leagueCreationID,
									percent: 0,
							  }
							: undefined,
					},
				],
				conditions,
			);
		},
		transform(chunk, controller) {
			controller.enqueue(chunk);
			if (doIt) {
				sizeSoFar += chunk.length;
				const percent = Math.round((sizeSoFar / sizeInBytes) * 100);

				if (percent > lastPercentEmitted) {
					toUI(
						"updateLocal",
						[
							{
								leagueCreationPercent: {
									id: leagueCreationID,
									percent,
								},
							},
						],
						conditions,
					);
					lastPercentEmitted = percent;
				}
			}
		},
	});
};

const initialCheck = async (
	{
		file,
		includePlayersInBasicInfo,
		leagueCreationID,
	}: {
		file: File | string;
		includePlayersInBasicInfo: boolean | undefined;
		leagueCreationID: number;
	},
	conditions: Conditions,
) => {
	let stream: ReadableStream;
	let sizeInBytes: number | undefined;
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
		const size = response.headers.get("content-length");
		if (size) {
			sizeInBytes = Number(size);
		}
	} else {
		stream = file.stream() as unknown as ReadableStream;
		sizeInBytes = file.size;
	}

	const stream0 = toPolyfillReadable(stream);

	// I HAVE NO IDEA WHY THIS LINE IS NEEDED, but without this, Firefox seems to cut the stream off early
	(self as any).stream0 = stream0;

	const stream2 = stream0
		.pipeThrough(emitProgressStream(leagueCreationID, sizeInBytes, conditions))
		.pipeThrough(toPolyfillTransform(new TextDecoderStream()));
	const { basicInfo, schemaErrors } = await getBasicInfo({
		stream: stream2,
		includePlayersInBasicInfo,
		leagueCreationID,
		conditions,
	});

	delete (self as any).stream0;

	return {
		basicInfo,
		schemaErrors,
	};
};

export default {
	initialCheck,
};
