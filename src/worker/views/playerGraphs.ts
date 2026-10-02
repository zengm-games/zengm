import {
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
	RATINGS,
	getPlayerStatsTableStats,
} from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type {
	UpdateEvents,
	ViewInput,
	ViewPrev,
	PlayerStatType,
} from "../../common/types.ts";
import { POS_NUMBERS } from "../../common/constants.baseball.ts";
import { last, maxBy } from "../../common/utils.ts";
import {
	getStats,
	getStatsTableByType,
} from "../../common/advancedPlayerSearch.ts";
import { choice } from "../../common/random.ts";
import { getNumericStat, hasNonZeroStat } from "../../common/statValue.ts";

export const statTypes = [
	"bio",
	"ratings",
	...(__SPORT === "basketball"
		? ["perGame", "per36", "totals", "shotLocations", "advanced", "gameHighs"]
		: Object.keys(PLAYER_STATS_TABLES)),
];

const getPlayerStats = async (
	statTypeInput: string | undefined,
	season: number | "career",
	playoffs: "playoffs" | "regularSeason" | "combined",
) => {
	// This is the value form the form/URL (or a random one), which confusingly is not the same as statType passed to playersPlus
	const statTypePlus =
		statTypeInput !== undefined && statTypes.includes(statTypeInput)
			? statTypeInput
			: choice(statTypes);

	const statsTable = getStatsTableByType(statTypePlus);

	const ratings =
		statTypePlus === "ratings" ? (["ovr", "pot", ...RATINGS] as const) : [];
	let statType: PlayerStatType;
	if (__SPORT === "basketball") {
		if (statTypePlus === "totals") {
			statType = "totals";
		} else if (statTypePlus === "per36") {
			statType = "per36";
		} else {
			statType = "perGame";
		}
	} else {
		statType = "totals";
	}

	let playersAll;

	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players(
			{
				activeSeason: typeof season === "number" ? season : undefined,
			},
			"noCopyCache",
		);
	}

	const statKeys = statsTable
		? getPlayerStatsTableStats(statsTable.stats)
		: (["gp"] as const);

	const playersPlusOptions = {
		attrs: [
			"pid",
			"name",
			"tid",

			// draft is needed to know who is undrafted, for the tooltip
			"draft",
			...(statTypePlus === "bio"
				? (["age", "salary", "draftPosition"] as const)
				: []),
		],
		ratings,
		stats: statKeys,
		statType,
		seasonType: playoffs,
		mergeStats: "totOnly",
		fuzz: true,
	} as const;

	// Normalize to a single ratings row and a single stats row per player. These are copies, because they get modified below. The UI accesses them dynamically based on the selected stat, so they're just records here
	const toRow = <P extends object>(
		p: P,
		ratingsRow: object | undefined,
		statsRow: object | undefined,
	) => {
		const ratingsRecord: Record<string, unknown> | undefined =
			ratings.length > 0 && ratingsRow ? { ...ratingsRow } : undefined;
		const statsRecord: Record<string, unknown> = { ...statsRow };
		return {
			...p,
			ratings: ratingsRecord,
			stats: statsRecord,
		};
	};

	let players;
	if (season === "career") {
		const playersRaw = await idb.getCopies.playersPlus(
			playersAll,
			playersPlusOptions,
		);
		players = playersRaw.map(
			({
				careerStats,
				careerStatsPlayoffs,
				careerStatsCombined,
				ratings: allRatings,
				stats: allStats,
				...p
			}) =>
				toRow(
					p,
					// Show row from max ovr season. allRatings is only actually there if ratings were requested
					ratings.length > 0
						? (maxBy(allRatings, (row) => row.ovr) ?? last(allRatings))
						: undefined,
					playoffs === "playoffs"
						? careerStatsPlayoffs
						: playoffs === "combined"
							? careerStatsCombined
							: careerStats,
				),
		);
	} else {
		const playersRaw = await idb.getCopies.playersPlus(playersAll, {
			...playersPlusOptions,
			season,
		});
		players = playersRaw.map(({ ratings: ratingsRow, stats: statsRow, ...p }) =>
			toRow(p, ratingsRow, statsRow),
		);
	}

	// HACKY! Sum up fielding stats, rather than by position
	if (__SPORT === "baseball" && statTypePlus === "fielding") {
		for (const p of players) {
			// Ignore DH games played, so that filtering on GP in the Player Graphs UI does something reasonable. Otherwise DHs with 0 fielding stats appear in all the fielding graphs.
			const dhIndex = POS_NUMBERS.DH - 1;
			let gp = 0;
			const gpF = p.stats.gpF;
			if (Array.isArray(gpF)) {
				for (const [i, value] of gpF.entries()) {
					if (i !== dhIndex && typeof value === "number") {
						gp += value;
					}
				}
			}
			p.stats.gp = gp;

			// Sum up stats
			for (const stat of statKeys) {
				const value = p.stats[stat];
				if (Array.isArray(value)) {
					let sum = 0;
					for (const valueByPos of value) {
						if (typeof valueByPos === "number") {
							sum += valueByPos;
						}
					}
					p.stats[stat] = sum;
				}
			}

			// Fix Fld%
			const getNumber = (stat: string) => getNumericStat(p.stats[stat]) ?? 0;
			const po = getNumber("po");
			const a = getNumber("a");
			const e = getNumber("e");
			p.stats.fldp = helpers.ratio(po + a, po + a + e);
		}
	}

	if (statsTable?.onlyShowIf && __SPORT !== "basketball") {
		// Ensure some non-zero stat for this position
		const onlyShowIf = statsTable.onlyShowIf;

		players = players.filter((p) => {
			for (const stat of onlyShowIf) {
				if (hasNonZeroStat(p.stats[stat])) {
					return true;
				}
			}

			return false;
		});
	}

	if (g.get("challengeNoRatings") && ratings.length > 0) {
		for (const p of players) {
			if (p.tid !== PLAYER.RETIRED && p.ratings) {
				for (const key of ratings) {
					p.ratings[key] = 50;
				}
			}
		}
	}

	const stats = getStats(statTypePlus);
	return { players, stats, statType: statTypePlus };
};

const updatePlayers = async (
	axis: "X" | "Y",
	inputs: ViewInput<"playerGraphs">,
	updateEvents: UpdateEvents,
	prev: ViewPrev<"playerGraphs">,
) => {
	const season = `season${axis}` as const;
	const statType = `statType${axis}` as const;
	const playoffs = `playoffs${axis}` as const;
	if (
		updateEvents.includes("firstRun") ||
		(inputs[season] === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		// Purposely skip checking statX, statY, minGames - those are only used client side, they in the URL for usability
		inputs[season] !== prev.inputs?.[season] ||
		inputs[statType] !== prev.inputs?.[statType] ||
		inputs[playoffs] !== prev.inputs?.[playoffs]
	) {
		const statForAxis = await getPlayerStats(
			inputs[statType],
			inputs[season],
			inputs[playoffs],
		);

		const statKey = `stat${axis}` as const;
		const inputStat = inputs[statKey];

		const stat =
			inputStat !== undefined && statForAxis.stats.includes(inputStat)
				? inputStat
				: choice(statForAxis.stats);

		return {
			[season]: inputs[season],
			[statType]: statForAxis.statType,
			[playoffs]: inputs[playoffs],
			[`players${axis}`]: statForAxis.players,
			[`stats${axis}`]: statForAxis.stats,
			[statKey]: stat,
			minGames: inputs.minGames,
		};
	}
};

export type PlayerGraphsPlayer = Awaited<
	ReturnType<typeof getPlayerStats>
>["players"][number];

const updateClientSide = (
	inputs: ViewInput<"playerGraphs">,
	prev: ViewPrev<"playerGraphs">,
	x: Awaited<ReturnType<typeof updatePlayers>>,
	y: Awaited<ReturnType<typeof updatePlayers>>,
) => {
	if (
		inputs.minGames !== prev.inputs?.minGames ||
		inputs.statX !== prev.inputs?.statX ||
		inputs.statY !== prev.inputs?.statY
	) {
		// Check x and y for statX and statY in case they were already specified there, such as randomly selecting from statForAxis
		return {
			statX: x?.statX ?? inputs.statX,
			statY: y?.statY ?? inputs.statY,
			minGames: inputs.minGames,
		} as {
			// We can assert this because we know the above block runs on first render, so this is just updating an existing state, so we don't want TypeScript to get confused
			seasonX: number | "career";
			seasonY: number | "career";
			statTypeX: string;
			statTypeY: string;
			playoffsX: "playoffs" | "regularSeason" | "combined";
			playoffsY: "playoffs" | "regularSeason" | "combined";
			playersX: PlayerGraphsPlayer[];
			playersY: PlayerGraphsPlayer[];
			statsX: string[];
			statsY: string[];
			statX: string;
			statY: string;
			minGames: string;
		};
	}
};

export default async (
	inputs: ViewInput<"playerGraphs">,
	updateEvents: UpdateEvents,
	prev: ViewPrev<"playerGraphs">,
) => {
	const x = await updatePlayers("X", inputs, updateEvents, prev);
	const y = await updatePlayers("Y", inputs, updateEvents, prev);

	return Object.assign({}, x, y, updateClientSide(inputs, prev, x, y));
};
