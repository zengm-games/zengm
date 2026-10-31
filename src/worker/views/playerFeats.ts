import { idb } from "../db/index.ts";
import type { PlayerFeat } from "../../common/types.ts";
import { g, helpers } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { processPlayerStats } from "../util/processPlayerStats.ts";
import { getWatchPids } from "./news.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateAbbrev } from "../util/processInputs.ts";
import { validateSeason } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"playerFeats">) => {
	let abbrev;
	let tid: number | undefined;
	const [validatedTid, validatedAbbrev] = validateAbbrev(params.abbrev, true);
	if (params.abbrev !== undefined && validatedAbbrev !== "???") {
		abbrev = validatedAbbrev;
		tid = validatedTid;
	} else if (params.abbrev === "watch") {
		abbrev = "watch";
	} else {
		abbrev = "all";
	}

	let season: number | "all";

	if (params.season && params.season !== "all") {
		season = validateSeason(params.season);
	} else {
		season = "all";
	}

	return {
		abbrev,
		season,
		tid,
	};
};

export default defineView({
	id: "playerFeats",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("gameSim") ||
			inputs.abbrev !== prevInputs?.abbrev ||
			inputs.season !== prevInputs?.season
		) {
			const watchPids =
				inputs.abbrev === "watch" ? await getWatchPids() : undefined;

			// Applied while reading feats, so feats that won't be shown are not all held in memory
			const filter = (feat: PlayerFeat) =>
				(inputs.tid === undefined || feat.tid === inputs.tid) &&
				(watchPids === undefined || watchPids.has(feat.pid)) &&
				(inputs.season === "all" || feat.season === inputs.season);

			const feats = await idb.merged.playerFeats.getAll(undefined, { filter });

			const featsProcessed = feats.map((feat) => {
				const featStats = { ...feat.stats };
				let score = feat.score;

				if (__SPORT === "basketball") {
					featStats.trb = featStats.orb + featStats.drb;
					featStats.fgp =
						featStats.fga > 0 ? (100 * featStats.fg) / featStats.fga : 0;
					featStats.tpp =
						featStats.tpa > 0 ? (100 * featStats.tp) / featStats.tpa : 0;
					featStats.ftp =
						featStats.fta > 0 ? (100 * featStats.ft) / featStats.fta : 0;

					featStats.gmsc = helpers.gameScore(featStats);
				} else if (__SPORT === "hockey") {
					const toAdd = ["g", "a", "pts", "sPct", "foPct"];
					const processed = processPlayerStats(featStats, toAdd);
					for (const stat of toAdd) {
						featStats[stat] = processed[stat];
					}
				} else if (__SPORT === "baseball") {
					const toAdd = ["ab", "ip", "gmsc"];
					const processed = processPlayerStats(featStats, toAdd);
					for (const stat of toAdd) {
						featStats[stat] = processed[stat];
					}
				}

				const overtimeText = helpers.overtimeText(
					feat.overtimes,
					feat.numPeriods,
				);
				if (overtimeText !== "") {
					score += ` (${overtimeText})`;
				}

				let type: "regularSeason" | "playoffs" | "allStar";
				if (feat.playoffs) {
					type = "playoffs";
				} else if (feat.tid === -1 || feat.tid === -2) {
					type = "allStar";
				} else {
					type = "regularSeason";
				}

				return {
					...feat,
					stats: featStats,
					score,
					abbrev: g.get("teamInfoCache")[feat.tid]?.abbrev,
					oppAbbrev: g.get("teamInfoCache")[feat.oppTid]?.abbrev,
					type,
				};
			});

			const stats = bySport({
				baseball: [
					"ab",
					"r",
					"h",
					"rbi",
					"hr",
					"sb",
					"bb",
					"so",
					"pa",
					"ip",
					"hPit",
					"rPit",
					"er",
					"bbPit",
					"soPit",
					"hrPit",
					"pc",
					"gmsc",
				],
				basketball: [
					"gs",
					"min",
					"fg",
					"fga",
					"fgp",
					"tp",
					"tpa",
					"tpp",
					"ft",
					"fta",
					"ftp",
					"orb",
					"drb",
					"trb",
					"ast",
					"tov",
					"stl",
					"blk",
					"pf",
					"pts",
					"gmsc",
				],
				football: [
					"pssCmp",
					"pss",
					"pssYds",
					"pssTD",
					"rus",
					"rusYds",
					"rusTD",
					"rec",
					"recYds",
					"recTD",
					"defInt",
					"defIntTD",
					"defFmbFrc",
					"defFmbRec",
					"defFmbTD",
					"defSk",
					"defSft",
					"prTD",
					"krTD",
				],
				hockey: [
					"g",
					"a",
					"pts",
					"pm",
					"pim",
					"evG",
					"ppG",
					"shG",
					"gwG",
					"evA",
					"ppA",
					"shA",
					"gwA",
					"s",
					"sPct",
					"tsa",
					"min",
					"fow",
					"fol",
					"foPct",
					"blk",
					"hit",
					"tk",
					"gv",
					"sv",
				],
			});
			return {
				abbrev: inputs.abbrev,
				feats: featsProcessed,
				quarterLengthFactor: helpers.quarterLengthFactor(),
				season: inputs.season,
				stats,
			};
		}
	},
});
