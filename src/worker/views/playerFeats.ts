import { idb } from "../db";
import { g, helpers, processPlayerStats } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { bySport, isSport } from "../../common";

const updatePlayers = async (
	inputs: ViewInput<"playerFeats">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("gameSim") ||
		inputs.abbrev !== state.abbrev ||
		inputs.season !== state.season
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

		if (inputs.abbrev !== "all") {
			feats = feats.filter(
				feat => g.get("teamInfoCache")[feat.tid]?.abbrev === inputs.abbrev,
			);
		}

		if (inputs.season !== "all") {
			feats = feats.filter(feat => feat.season === inputs.season);
		}

		const featsProcessed = feats.map(feat => {
			if (isSport("basketball")) {
				feat.stats.trb = feat.stats.orb + feat.stats.drb;
				feat.stats.fgp =
					feat.stats.fga > 0 ? (100 * feat.stats.fg) / feat.stats.fga : 0;
				feat.stats.tpp =
					feat.stats.tpa > 0 ? (100 * feat.stats.tp) / feat.stats.tpa : 0;
				feat.stats.ftp =
					feat.stats.fta > 0 ? (100 * feat.stats.ft) / feat.stats.fta : 0;

				feat.stats.gmsc = helpers.gameScore(feat.stats);
			} else if (isSport("hockey")) {
				const toAdd = ["g", "a", "pts", "sPct", "foPct"];
				const processed = processPlayerStats(feat.stats, toAdd);
				for (const stat of toAdd) {
					feat.stats[stat] = processed[stat];
				}
			}

			const pts = feat.score.split("-").map(x => parseInt(x));
			let diff = -Infinity;
			if (!Number.isNaN(pts[0]) && !Number.isNaN(pts[1])) {
				diff = pts[0] - pts[1];
			}

			if (feat.overtimes === 1) {
				feat.score += " (OT)";
			} else if (feat.overtimes > 1) {
				feat.score += ` (${feat.overtimes}OT)`;
			}

			let type: string;
			if (feat.playoffs) {
				type = "Playoffs";
			} else if (feat.tid === -1 || feat.tid === -2) {
				type = "All-Star";
			} else {
				type = "Regular Season";
			}

			return {
				...feat,
				abbrev: g.get("teamInfoCache")[feat.tid]?.abbrev,
				oppAbbrev: g.get("teamInfoCache")[feat.oppTid]?.abbrev,
				type,
				diff,
			};
		});

		const stats = bySport({
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
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
