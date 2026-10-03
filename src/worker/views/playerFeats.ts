import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { processPlayerStats } from "../util/processPlayerStats.ts";
import { getWatchPids } from "./news.ts";

export default defineView(
	"playerFeats",
	async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.includes("firstRun") ||
			updateEvents.includes("gameSim") ||
			inputs.abbrev !== prevInputs?.abbrev ||
			inputs.season !== prevInputs?.season
		) {
			let feats = await idb.getCopies.playerFeats();

			// Put fake fid on cached feats
			let maxFid = 0;

			for (const feat of feats) {
				if (feat.fid !== undefined) {
					if (feat.fid > maxFid) {
						maxFid = feat.fid;
					}
				} else {
					maxFid += 1;
					feat.fid = maxFid;
				}
			}

			if (inputs.tid !== undefined) {
				feats = feats.filter((feat) => feat.tid === inputs.tid);
			} else if (inputs.abbrev === "watch") {
				const watchPids = await getWatchPids();
				feats = feats.filter((feat) => watchPids.has(feat.pid));
			}

			if (inputs.season !== "all") {
				feats = feats.filter((feat) => feat.season === inputs.season);
			}

			const featsProcessed = feats.map((feat) => {
				if (__SPORT === "basketball") {
					feat.stats.trb = feat.stats.orb + feat.stats.drb;
					feat.stats.fgp =
						feat.stats.fga > 0 ? (100 * feat.stats.fg) / feat.stats.fga : 0;
					feat.stats.tpp =
						feat.stats.tpa > 0 ? (100 * feat.stats.tp) / feat.stats.tpa : 0;
					feat.stats.ftp =
						feat.stats.fta > 0 ? (100 * feat.stats.ft) / feat.stats.fta : 0;

					feat.stats.gmsc = helpers.gameScore(feat.stats);
				} else if (__SPORT === "hockey") {
					const toAdd = ["g", "a", "pts", "sPct", "foPct"];
					const processed = processPlayerStats(feat.stats, toAdd);
					for (const stat of toAdd) {
						feat.stats[stat] = processed[stat];
					}
				} else if (__SPORT === "baseball") {
					const toAdd = ["ip", "gmsc"];
					const processed = processPlayerStats(feat.stats, toAdd);
					for (const stat of toAdd) {
						feat.stats[stat] = processed[stat];
					}
				}

				const overtimeText = helpers.overtimeText(
					feat.overtimes,
					feat.numPeriods,
				);
				if (overtimeText !== "") {
					feat.score += ` (${overtimeText})`;
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
);
