import { PHASE, PLAYER } from "../../../common";
import type {
	Conf,
	Div,
	GameAttributesLeague,
	GetLeagueOptions,
	League,
} from "../../../common/types";
import type { NewLeagueTeam } from "../../../ui/views/NewLeague/types";
import { CUMULATIVE_OBJECTS, parseJSON } from "../../api/leagueFileUpload";
import { connectLeague, idb } from "../../db";
import { helpers } from "../../util";
import g, { wrap } from "../../util/g";
import type { Settings } from "../../views/settings";
import initRepeatSeason from "./initRepeatSeason";
import remove from "./remove";

const addDummyLeague = async ({
	lid,
	name,
	tid,
}: {
	lid: number;
	name: string;
	tid: number;
}) => {
	// These values will be updated later. We just want to make sure there's something in the meta database first, so the league can be deleted from the normal UI if something goes wrong.
	const dummyLeague: League = {
		lid,
		name,
		tid,
		phaseText: "",
		teamName: "",
		teamRegion: "",
		heartbeatID: undefined,
		heartbeatTimestamp: undefined,
		difficulty: 0,
		created: new Date(),
		lastPlayed: new Date(),
		startingSeason: 0,
		season: 0,
		imgURL: undefined,
	};

	// In case there was an old league with this lid, somehow
	const oldLeague = await idb.meta.get("leagues", lid);
	await remove(lid);
	if (oldLeague) {
		dummyLeague.created = oldLeague.created;
		dummyLeague.starred = oldLeague.starred;
	}

	await idb.meta.add("leagues", dummyLeague);
	idb.league = await connectLeague(lid);
};

const preProcess = (key: string, value: any) => {
	return value;
};

const getSaveToDB = async ({
	keys,
	lid,
	name,
	tid,
}: {
	keys: Set<string>;
	lid: number;
	name: string;
	tid: number;
}) => {
	await addDummyLeague({
		lid,
		name,
		tid,
	});

	let currentKey: any;
	let buffer: any[] = [];
	const MAX_BUFFER_SIZE = 1000;

	const flushBuffer = async () => {
		const transaction = idb.league.transaction(currentKey, "readwrite");

		for (const row of buffer) {
			transaction.store.put(row);
		}

		await transaction.done;

		buffer = [];
	};

	const extraFromStream: {
		gameAttributes?: any;
		startingSeason?: number;
		version?: number;
	} = {};

	const writableStream = new WritableStream<{
		key: string;
		value: any;
	}>({
		async write(chunk, controller) {
			const { key, value } = chunk;
			if (currentKey !== key) {
				await flushBuffer();
				currentKey = key;
			}

			if (!keys.has(key)) {
				return;
			}

			if (
				key === "gameAttributes" ||
				key === "startingSeason" ||
				key === "version"
			) {
				extraFromStream[key] = value;
			} else if (CUMULATIVE_OBJECTS.has(key)) {
				// These don't get written to database (currently just meta)
				return;
			}

			buffer.push(preProcess(key, value));
			if (buffer.length >= MAX_BUFFER_SIZE) {
				await flushBuffer();
			}
		},

		async close() {
			await flushBuffer();
		},
	});

	return {
		extraFromStream,
		saveToDB: writableStream,
	};
};

const finalizeStartingSeason = (
	startingSeason: number | undefined,
	actualStartingSeason: string | undefined,
) => {
	if (startingSeason !== undefined) {
		return startingSeason;
	}

	if (actualStartingSeason) {
		const startingSeason2 = parseInt(actualStartingSeason);
		if (!Number.isNaN(startingSeason2)) {
			return startingSeason2;
		}
	}

	return new Date().getFullYear();
};

type GameAttributeOverrides = Partial<Record<keyof GameAttributesLeague, any>>;

const finalizeGameAttributes = ({
	gameAttributes,
	gameAttributeOverrides,
	getLeagueOptions,
	randomization,
	startingSeason,
	tid,
}: {
	gameAttributes: any;
	gameAttributeOverrides: GameAttributeOverrides;
	getLeagueOptions: GetLeagueOptions | undefined;
	randomization: "none" | "shuffle" | "debuts" | "debutsForever";
	startingSeason: number;
	tid: number;
}) => {
	const finalized = {
		...gameAttributes,
	};

	for (const key of helpers.keys(gameAttributeOverrides)) {
		// If we're overriding a value with history, keep the history
		finalized[key] = wrap(finalized, key, gameAttributeOverrides[key], {
			season: finalized.season ?? startingSeason,
			phase: finalized.phase ?? PHASE.PRESEASON,
		});
	}

	if (
		randomization === "debutsForever" &&
		finalized.randomDebutsForever === undefined
	) {
		finalized.randomDebutsForever = 1;
	}

	if (
		getLeagueOptions?.type === "real" &&
		getLeagueOptions?.realStats === "all"
	) {
		let start = finalized.season;
		if (getLeagueOptions.phase > PHASE.PLAYOFFS) {
			start += 1;
		}

		// startingSeason is 1947, so use userTid history to denote when user actually started managing team
		finalized.userTid = [
			{ start: -Infinity, value: PLAYER.DOES_NOT_EXIST },
			{
				start,
				value: tid,
			},
		];
	}

	return finalized;
};

const createStream = async (
	stream: ReadableStream,
	{
		actualStartingSeason,
		confs,
		divs,
		getLeagueOptions,
		keys,
		lid,
		name,
		settings,
		teams, // use if none in file
		tid,
	}: {
		actualStartingSeason: string | undefined;
		confs: Conf[];
		divs: Div[];
		getLeagueOptions: GetLeagueOptions | undefined;
		keys: Set<string>;
		lid: number;
		name: string;
		settings: Omit<Settings, "numActiveTeams">;
		teams: NewLeagueTeam[];
		tid: number;
	},
) => {
	// Single out all the weird settings that don't go directly into gameAttributes
	const {
		noStartingInjuries,
		randomization,
		repeatSeason,

		// realStats is already in getLeagueOptions
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		realStats,

		...otherSettings
	} = settings;

	const gameAttributeOverrides: GameAttributeOverrides = {
		...otherSettings,
		confs,
		divs,
	};

	// This setting is allowed to be undefined, so make it that way when appropriate
	if (!getLeagueOptions || getLeagueOptions.type !== "real") {
		delete gameAttributeOverrides.realDraftRatings;
	}

	const { extraFromStream, saveToDB } = await getSaveToDB({
		keys,
		lid,
		name,
		tid,
	});

	await stream.pipeThrough(parseJSON()).pipeTo(saveToDB);

	const startingSeason = finalizeStartingSeason(
		extraFromStream.startingSeason,
		actualStartingSeason,
	);

	const gameAttributes = await finalizeGameAttributes({
		gameAttributes: extraFromStream.gameAttributes ?? {},
		gameAttributeOverrides,
		getLeagueOptions,
		randomization,
		startingSeason,
		tid,
	});

	await finalizeDB();

	// Handle repeatSeason after creating league, so we know what random players were created
	if (repeatSeason && g.get("repeatSeason") === undefined) {
		await initRepeatSeason();
	}
};

export default createStream;
