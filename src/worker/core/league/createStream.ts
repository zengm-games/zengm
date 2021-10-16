import { PHASE, PLAYER } from "../../../common";
import type {
	Conditions,
	Conf,
	Div,
	GameAttributesLeague,
	GetLeagueOptions,
	League,
	TeamBasic,
	TeamSeasonWithoutKey,
	TeamStatsWithoutKey,
} from "../../../common/types";
import type { NewLeagueTeam } from "../../../ui/views/NewLeague/types";
import { CUMULATIVE_OBJECTS, parseJSON } from "../../api/leagueFileUpload";
import { connectLeague, idb } from "../../db";
import { helpers } from "../../util";
import g, { wrap } from "../../util/g";
import type { Settings } from "../../views/settings";
import createGameAttributes from "./createGameAttributes";
import initRepeatSeason from "./initRepeatSeason";
import remove from "./remove";

export type TeamInfo = TeamBasic & {
	disabled?: boolean;
	stadiumCapacity?: number;
	seasons?: TeamSeasonWithoutKey[];
	stats?: TeamStatsWithoutKey[];
};

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

class Buffer {
	MAX_BUFFER_SIZE: number;
	keptKeys: Set<string>;
	keys: Set<string>;
	rows: [string, any][];

	constructor(keptKeys: Set<string>) {
		this.MAX_BUFFER_SIZE = 1000;
		this.keptKeys = keptKeys;

		this.keys = new Set();
		this.rows = [];
	}

	addRows(rows: [string, any][]) {
		for (const row of rows) {
			const key = row[0];

			if (!this.keptKeys.has(key)) {
				return;
			}

			this.keys.add(key);
			this.rows.push(row);
		}
	}

	private clear() {
		this.keys = new Set();
		this.rows = [];
	}

	isFull() {
		return this.rows.length >= this.MAX_BUFFER_SIZE;
	}

	async flush() {
		const transaction = idb.league.transaction(
			Array.from(this.keys) as any,
			"readwrite",
		);

		for (const row of this.rows) {
			transaction.objectStore(row[0]).put(row[1]);
		}

		await transaction.done;

		this.clear();
	}
}

const preProcess = (
	key: string,
	x: any,
	{
		averagePopulation,
		noStartingInjuries,
	}: {
		averagePopulation: number | undefined;
		noStartingInjuries: boolean;
	},
) => {
	if (key === "draftPicks") {
		if (typeof x.pick !== "number") {
			x.pick = 0;
		}
	} else if (key === "games") {
		// Fix missing +/-, blocks against in boxscore
		if (!x.teams[0].hasOwnProperty("ba")) {
			x.teams[0].ba = 0;
			x.teams[1].ba = 0;
		}
		for (const t of x.teams) {
			for (const p of t.players) {
				if (!p.hasOwnProperty("ba")) {
					p.ba = 0;
				}
				if (!p.hasOwnProperty("pm")) {
					p.pm = 0;
				}
			}
		}
	} else if (key === "players") {
		if (noStartingInjuries && x.injury) {
			x.injury = {
				type: "Healthy",
				gamesRemaining: 0,
			};
		}
	} else if (key === "scheduledEvents" && averagePopulation !== undefined) {
		if (x.type === "expansionDraft") {
			for (const t of x.info.teams) {
				t.pop = averagePopulation;
			}
		} else if (x.type === "teamInfo" && x.info.pop !== undefined) {
			x.info.pop = averagePopulation;
		}
	}

	return [key, x];
};

const getSaveToDB = async ({
	keys,
	lid,
	name,
	preProcessParams,
	tid,
}: {
	keys: Set<string>;
	lid: number;
	name: string;
	preProcessParams: {
		averagePopulation: number | undefined;
		noStartingInjuries: boolean;
	};
	tid: number;
}) => {
	await addDummyLeague({
		lid,
		name,
		tid,
	});

	const buffer = new Buffer(keys);

	const extraFromStream: {} = {};

	const writableStream = new WritableStream<{
		key: string;
		value: any;
	}>({
		async write(chunk, controller) {
			const { key, value } = chunk;

			if (CUMULATIVE_OBJECTS.has(key) || key === "teams") {
				// Currently skipped:
				// - meta because it doesn't get written to DB
				// - gameAttributes/startingSeason/version/teams because we already have it from basicInfo.
				return;
			}

			const rows = preProcess(key, value, preProcessParams);
			buffer.addRows(rows);
			if (buffer.isFull()) {
				await buffer.flush();
			}
		},

		async close() {
			await buffer.flush();
		},
	});

	return {
		extraFromStream,
		saveToDB: writableStream,
	};
};

const finalizeStartingSeason = (
	startingSeasonFromFile: number | undefined,
	startingSeasonFromInput: string | undefined,
) => {
	if (startingSeasonFromFile !== undefined) {
		return startingSeasonFromFile;
	}

	if (startingSeasonFromInput) {
		const startingSeason2 = parseInt(startingSeasonFromInput);
		if (!Number.isNaN(startingSeason2)) {
			return startingSeason2;
		}
	}

	return new Date().getFullYear();
};

type GameAttributeOverrides = Partial<Record<keyof GameAttributesLeague, any>>;

const finalizeGameAttributes = async ({
	conditions,
	gameAttributes,
	gameAttributeOverrides,
	getLeagueOptions,
	randomization,
	startingSeason,
	teamInfos,
	tid,
	version,
}: {
	conditions?: Conditions;
	gameAttributes: any;
	gameAttributeOverrides: GameAttributeOverrides;
	getLeagueOptions: GetLeagueOptions | undefined;
	randomization: "none" | "shuffle" | "debuts" | "debutsForever";
	startingSeason: number;
	teamInfos: TeamInfo[];
	tid: number;
	version: number | undefined;
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

	// Also mutates teamInfos
	const finalized2 = await createGameAttributes(
		{
			gameAttributesInput: finalized,
			startingSeason,
			teamInfos,
			userTid: tid,
			version,
		},
		conditions,
	);

	return finalized2;
};

const finalizeDB = async ({ tid }: { tid: number }) => {
	const tx = idb.league.transaction("trade", "readwrite");
	const trade = await tx.store.get(0);
	if (!trade) {
		tx.store.add({
			rid: 0,
			teams: [
				{
					tid,
					pids: [],
					pidsExcluded: [],
					dpids: [],
					dpidsExcluded: [],
				},
				{
					// Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
					tid: tid === 0 ? 1 : 0,
					pids: [],
					pidsExcluded: [],
					dpids: [],
					dpidsExcluded: [],
				},
			],
		});
	}

	if (gameAttributes.phase === PHASE.DRAFT && leagueFile.draftPicks) {
		const currentDraftPicks = leagueFile.draftPicks.filter(
			dp => dp.season === gameAttributes.season,
		);
		const draftNotStarted =
			currentDraftPicks.every(dp => dp.round === 0) ||
			currentDraftPicks.some(dp => dp.round === 1 && dp.pick === 1);
		if (draftNotStarted) {
			const numDraftPicksCurrent = currentDraftPicks.length;
			if (numDraftPicksCurrent > 0) {
				gameAttributes.numDraftPicksCurrent = numDraftPicksCurrent;
			}
		}
	}
};

const confirmSequential = (objs: any, key: string, objectName: string) => {
	const values = new Set();

	for (const obj of objs) {
		const value = obj[key];

		if (typeof value !== "number") {
			throw new Error(`Missing or invalid ${key} for ${objectName}`);
		}

		values.add(value);
	}

	for (let i = 0; i < values.size; i++) {
		if (!values.has(i)) {
			throw new Error(
				`${key} values must be sequential with no gaps starting from 0, but no ${objectName} has a value of ${i}`,
			);
		}
	}

	return values;
};

const createStream = async (
	stream: ReadableStream,
	{
		conditions,
		confs,
		divs,
		fromFile,
		getLeagueOptions,
		keys,
		lid,
		name,
		settings,
		startingSeasonFromInput,
		teamsFromInput, // use if none in file
		tid,
	}: {
		conditions?: Conditions;
		confs: Conf[];
		divs: Div[];
		fromFile: {
			gameAttributes: Record<string, unknown> | undefined;
			startingSeason: number | undefined;
			teams: any[] | undefined;
			version: number | undefined;
		};
		getLeagueOptions: GetLeagueOptions | undefined;
		keys: Set<string>;
		lid: number;
		name: string;
		settings: Omit<Settings, "numActiveTeams">;
		startingSeasonFromInput: string | undefined;
		teamsFromInput: NewLeagueTeam[];
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

	const startingSeason = finalizeStartingSeason(
		fromFile.startingSeason,
		startingSeasonFromInput,
	);

	const teamInfos = helpers.addPopRank(fromFile.teams ?? teamsFromInput);

	// Validation of some identifiers
	confirmSequential(teamInfos, "tid", "team");

	const gameAttributes = await finalizeGameAttributes({
		conditions,
		// Use fromFile.gameAttributes in addition to gameAttributeOverrides because it preserves history and any non-standard settings
		gameAttributes: fromFile.gameAttributes ?? {},
		gameAttributeOverrides,
		getLeagueOptions,
		randomization,
		startingSeason,
		teamInfos,
		tid,
		version: fromFile.version,
	});

	let averagePopulation: number | undefined;
	if (gameAttributes.equalizeRegions) {
		let totalPopulation = 0;
		for (const t of teamInfos) {
			totalPopulation += t.pop;
		}

		// Round to 2 digits
		averagePopulation =
			Math.round((totalPopulation / teamInfos.length) * 100) / 100;

		for (const t of teamInfos) {
			t.pop = averagePopulation;
		}
	}

	const { extraFromStream, saveToDB } = await getSaveToDB({
		keys,
		lid,
		name,
		preProcessParams: {
			averagePopulation,
			noStartingInjuries,
		},
		tid,
	});

	await stream.pipeThrough(parseJSON()).pipeTo(saveToDB);

	await finalizeDB({
		tid,
	});

	// Handle repeatSeason after creating league, so we know what random players were created
	if (repeatSeason && g.get("repeatSeason") === undefined) {
		await initRepeatSeason();
	}
};

export default createStream;
