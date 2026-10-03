import { PLAYER, RATINGS } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import type {
	Player,
	PlayerRatingKey,
	PlayerStatAttr,
} from "../../common/types.ts";
import { defineView, type ViewInput } from "../util/defineView.ts";
import {
	finalizePlayersRelativesList,
	formatPlayerRelativesList,
} from "./customizePlayer.ts";
import { shuffle } from "../../common/random.ts";
import { g } from "../util/index.ts";
import { last, maxBy } from "../../common/utils.ts";
import { getPlayerProfileStats } from "./player.ts";
import type { SeasonType } from "../util/processInputs.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { getTeamInfoBySeason } from "../util/getTeamInfoBySeason.ts";
import type { RouteParams } from "../../ui/router/types.ts";

const processInputs = (params: RouteParams<"comparePlayers">) => {
	const players: {
		pid: number;
		season: number | "career";
		playoffs: SeasonType;
	}[] = [];

	const info = params.info;
	if (info !== undefined) {
		players.push(
			...info.split(",").map((pidSeasonPlayoffs) => {
				const parts = pidSeasonPlayoffs.split("-");
				return {
					pid: Number.parseInt(parts[0]!),
					season: parts[1] === "career" ? "career" : Number.parseInt(parts[1]!),
					playoffs:
						parts[2] === "c"
							? "combined"
							: parts[2] === "p"
								? "playoffs"
								: "regularSeason",
				} as const;
			}),
		);
	}

	return {
		players,
	};
};

const hasPlayerInfoChanged = (
	inputPlayers: ViewInput<typeof processInputs>["players"],
	prevInputPlayers: ViewInput<typeof processInputs>["players"] | undefined,
) => {
	// This just happens on initial render, which should never trigger because it checks firstRun before this, but let's just be careful
	if (prevInputPlayers === undefined) {
		return true;
	}

	// This happens when the URL is just /l/0/compare_players and it picks two random players, we don't want to refresh and pick new random players
	if (inputPlayers.length === 0) {
		return false;
	}

	if (inputPlayers.length !== prevInputPlayers.length) {
		return true;
	}

	for (const [inputP, prevInputP] of Iterator.zip(
		[inputPlayers, prevInputPlayers],
		{
			mode: "strict",
		},
	)) {
		if (
			inputP.pid !== prevInputP.pid ||
			inputP.season !== prevInputP.season ||
			inputP.playoffs !== prevInputP.playoffs
		) {
			return true;
		}
	}

	return false;
};

const getRatingsByPositions = (
	positions: string[],
): (PlayerRatingKey | "ovr" | "pot")[] => {
	const sportSpecific = bySport({
		baseball: () => {
			const ratings: PlayerRatingKey[] = ["hgt", "spd"];
			for (const pos of positions) {
				if (pos === "SP" || pos === "RP") {
					ratings.push("ppw", "ctl", "mov", "endu");
				} else {
					ratings.push("hpw", "con", "eye", "gnd", "fly", "thr", "cat");
				}
			}
			return new Set(ratings);
		},
		basketball: () => {
			return new Set(RATINGS);
		},
		football: () => {
			const ratings: PlayerRatingKey[] = ["hgt", "stre", "spd", "endu"];
			for (const pos of positions) {
				if (pos === "QB") {
					ratings.push("thv", "thp", "tha", "bsc");
				} else if (pos === "RB" || pos === "WR") {
					ratings.push("bsc", "elu", "rtr", "hnd");
				} else if (pos === "TE") {
					ratings.push("bsc", "elu", "rtr", "hnd", "pbk", "rbk");
				} else if (pos === "OL") {
					ratings.push("pbk", "rbk");
				} else if (pos === "DL") {
					ratings.push("tck", "prs", "rns");
				} else if (pos === "LB" || pos === "CB" || pos === "S") {
					ratings.push("pcv", "tck", "prs", "rns");
				} else if (pos === "K") {
					ratings.push("kpw", "kac");
				} else if (pos === "P") {
					ratings.push("ppw", "pac");
				}
			}
			return new Set(ratings);
		},
		hockey: () => {
			const ratings: PlayerRatingKey[] = [];
			for (const pos of positions) {
				if (pos === "G") {
					ratings.push("glk");
				} else {
					ratings.push(
						"hgt",
						"stre",
						"spd",
						"endu",
						"pss",
						"wst",
						"sst",
						"stk",
						"oiq",
						"chk",
						"blk",
						"fcf",
						"diq",
					);
				}
			}
			return new Set(ratings);
		},
	})();

	return [
		"ovr",
		"pot",
		...RATINGS.filter((rating) => sportSpecific.has(rating)),
	];
};

const getStatsByPositions = (positions: string[]) => {
	const sportSpecific = bySport<() => Iterable<PlayerStatAttr>>({
		baseball: () => {
			const stats: PlayerStatAttr[] = [];
			for (const pos of positions) {
				if (pos === "SP" || pos === "RP") {
					stats.push(
						"gpPit",
						"gsPit",
						"ip",
						"w",
						"l",
						"sv",
						"era",
						"soPit",
						"bbPit",
						"whip",
					);
				} else {
					stats.push(
						"gp",
						"pa",
						"h",
						"hr",
						"rbi",
						"sb",
						"ba",
						"obp",
						"slg",
						"ops",
					);
				}
			}
			return new Set<PlayerStatAttr>([...stats, "war"]);
		},
		basketball: () => {
			return [
				"gp",
				"min",
				"pts",
				"trb",
				"ast",
				"stl",
				"blk",
				"tov",
				"fgp",
				"ftp",
				"tpp",
				"tsp",
				"tpar",
				"ftr",
				"per",
				"bpm",
				"vorp",
			];
		},
		football: () => {
			const stats: PlayerStatAttr[] = ["gp"];
			for (const pos of positions) {
				if (pos === "QB") {
					stats.push(
						"qbRec",
						"pssCmp",
						"pss",
						"cmpPct",
						"pssYds",
						"pssTD",
						"pssInt",
						"qbRat",
						"rus",
						"rusYds",
						"rusYdsPerAtt",
						"rusTD",
						"fmbLost",
					);
				} else if (pos === "RB" || pos === "WR" || pos === "TE") {
					stats.push(
						"rus",
						"rusYds",
						"rusYdsPerAtt",
						"rusTD",
						"fmbLost",
						"tgt",
						"rec",
						"recYds",
						"recYdsPerRec",
						"recTD",
					);
				} else if (pos === "OL") {
					continue;
				} else if (
					pos === "DL" ||
					pos === "LB" ||
					pos === "CB" ||
					pos === "S"
				) {
					stats.push(
						"defTck",
						"defTckLoss",
						"defSk",
						"defSft",
						"defPssDef",
						"defInt",
						"defIntTD",
						"defFmbFrc",
						"defFmbRec",
						"defFmbTD",
					);
				} else if (pos === "K") {
					stats.push(
						"fg",
						"fga",
						"fgPct",
						"fgLng",
						"xp",
						"xpa",
						"xpPct",
						"kickingPts",
						"ko",
						"koYds",
						"koYdsPerAtt",
						"koTB",
						"koTBPct",
						"ok",
						"okRec",
						"okRecPct",
					);
				} else if (pos === "P") {
					stats.push(
						"pnt",
						"pntYdsPerAtt",
						"pntLng",
						"pntTB",
						"pntTBPct",
						"pntIn20",
						"pntIn20Pct",
						"pntBlk",
					);
				}
			}
			return new Set<PlayerStatAttr>([...stats, "fp", "av"]);
		},
		hockey: () => {
			const stats: PlayerStatAttr[] = [];
			for (const pos of positions) {
				if (pos === "G") {
					stats.push(
						"gpGoalie",
						"gRec",
						"ga",
						"sa",
						"sv",
						"svPct",
						"gaa",
						"so",
					);
				} else {
					stats.push(
						"gpSkater",
						"g",
						"a",
						"pts",
						"pm",
						"pim",
						"ppG",
						"shG",
						"gwG",
						"s",
						"ops",
						"dps",
					);
				}
			}
			return new Set<PlayerStatAttr>([...stats, "ps"]);
		},
	})();

	return Array.from(sportSpecific);
};

// Returns a single ratings row and a single stats row, for either one season or career totals (with peak ratings)
const getPlayer = async (
	pRaw: Player,
	season: number | "career",
	playoffs: SeasonType,
	allStats: PlayerStatAttr[],
) => {
	const playersPlusOptions = {
		attrs: [
			"pid",
			"firstName",
			"lastName",
			"born",
			"watch",
			"face",
			"imgURL",
			"awards",
			"draft",
			"tid",
			"experience",
			"contract",
			"salaries",
			"salariesTotal",
		],
		ratings: ["season", "pos", "ovr", "pot", ...RATINGS],
		stats: allStats,
		seasonType: playoffs,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
		mergeStats: "totOnly",
	} as const;

	if (season === "career") {
		const p = await idb.getCopy.playersPlus(pRaw, playersPlusOptions);
		if (!p) {
			return;
		}

		const {
			careerStats,
			careerStatsPlayoffs,
			careerStatsCombined,
			ratings: allRatings,
			stats: allSeasonStats,
			...rest
		} = p;

		const stats =
			playoffs === "playoffs"
				? careerStatsPlayoffs
				: playoffs === "combined"
					? careerStatsCombined
					: careerStats;
		if (!stats) {
			return;
		}

		// Peak ratings
		const ratings = maxBy(allRatings, "ovr") ?? last(allRatings);

		const teamInfo = await getTeamInfoBySeason(p.tid, ratings.season);

		return {
			...rest,
			ratings,
			stats,
			colors: teamInfo?.colors,
			jersey: teamInfo?.jersey,
		};
	}

	const p = await idb.getCopy.playersPlus(pRaw, {
		...playersPlusOptions,
		season,
	});
	if (!p) {
		return;
	}

	const teamInfo = await getTeamInfoBySeason(p.tid, season);

	return {
		...p,
		awards: p.awards.filter((award) => award.season === season),
		colors: teamInfo?.colors,
		jersey: teamInfo?.jersey,
	};
};

export default defineView({
	id: "comparePlayers",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			hasPlayerInfoChanged(inputs.players, prevInputs?.players)
		) {
			const currentPlayers = (await idb.cache.players.getAll()).filter((p) => {
				// Don't include far future players
				if (p.tid === PLAYER.UNDRAFTED && p.draft.year > g.get("season") + 2) {
					return false;
				}

				return true;
			});

			const playersToShow = [...inputs.players];

			// If fewer than 2 players, pick some random ones
			while (playersToShow.length < 2) {
				let found = false;

				const pidsToShow = new Set(playersToShow.map((p) => p.pid));

				shuffle(currentPlayers);
				for (const p of currentPlayers) {
					if (pidsToShow.has(p.pid)) {
						continue;
					}
					if (p.tid === PLAYER.UNDRAFTED) {
						continue;
					}

					// Current season, if possible
					const season =
						p.ratings.findLast((row) => row.season === g.get("season"))
							?.season ?? last(p.ratings).season;

					playersToShow.push({
						pid: p.pid,
						season,
						playoffs: "regularSeason",
					});
					found = true;
					break;
				}

				if (!found) {
					break;
				}
			}

			const allStats = getPlayerProfileStats();

			const players = [];
			for (const { pid, season, playoffs } of playersToShow) {
				const pRaw = await idb.getCopy.players({ pid }, "noCopyCache");
				if (!pRaw) {
					continue;
				}

				const p = await getPlayer(pRaw, season, playoffs, allStats);
				if (!p) {
					continue;
				}

				players.push({
					p,
					season,
					firstSeason: pRaw.ratings[0].season,
					lastSeason: last(pRaw.ratings).season,
					playoffs,
				});
			}

			// In summary table show ratings/stats relevant to these players' positions
			const positions = players.map((p) => p.p.ratings.pos);
			const ratings = getRatingsByPositions(positions);
			const stats = getStatsByPositions(positions);

			const initialAvailablePlayers = finalizePlayersRelativesList(
				currentPlayers.map(formatPlayerRelativesList),
			);

			return {
				initialAvailablePlayers,
				players,
				ratings,
				stats,
			};
		}
	},
});
