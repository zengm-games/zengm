import { team } from "../core";
import { idb } from "../db";
import { g } from "../util";
import posRatings from "../../common/posRatings";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { bySport, isSport } from "../../common";
import { NUM_LINES, NUM_PLAYERS_PER_LINE } from "../../common/constants.hockey";

const defenseStats = [
	"defTckSolo",
	"defTckAst",
	"defTck",
	"defTckLoss",
	"defSk",
	"defSft",
	"defPssDef",
	"defInt",
	"defIntYds",
	"defIntTD",
	"defIntLng",
	"defFmbFrc",
	"defFmbRec",
	"defFmbYds",
	"defFmbTD",
];

const stats = bySport<Record<string, string[]>>({
	basketball: {},
	football: {
		QB: [
			"pssCmp",
			"pss",
			"cmpPct",
			"pssYds",
			"pssTD",
			"pssInt",
			"pssSk",
			"pssSkYds",
			"qbRat",
			"fmbLost",
		],
		RB: [
			"rus",
			"rusYds",
			"rusYdsPerAtt",
			"rusLng",
			"rusTD",
			"tgt",
			"rec",
			"recYds",
			"recYdsPerAtt",
			"recTD",
			"recLng",
			"fmbLost",
		],
		WR: ["tgt", "rec", "recYds", "recYdsPerAtt", "recTD", "recLng", "fmbLost"],
		TE: ["tgt", "rec", "recYds", "recYdsPerAtt", "recTD", "recLng", "fmbLost"],
		OL: [],
		DL: defenseStats,
		LB: defenseStats,
		CB: defenseStats,
		S: defenseStats,
		K: ["fg", "fga", "fgPct", "fgLng", "xp", "xpa", "xpPct", "kickingPts"],
		P: ["pnt", "pntYdsPerAtt", "pntIn20", "pntTB", "pntLng", "pntBlk"],
		KR: ["kr", "krYds", "krYdsPerAtt", "krLng", "krTD"],
		PR: ["pr", "prYds", "prYdsPerAtt", "prLng", "prTD"],
	},
	hockey: {
		F: ["gp", "amin", "g", "a", "ops", "dps", "ps"],
		D: ["gp", "amin", "g", "a", "ops", "dps", "ps"],
		G: ["gp", "gaa", "svPct", "gps"],
	},
});

const updateDepth = async (
	{ abbrev, playoffs, pos, tid }: ViewInput<"depth">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (!isSport("football") && !isSport("hockey")) {
		throw new Error("Not implemented");
	}

	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("team") ||
		pos !== state.pos ||
		playoffs !== state.playoffs ||
		abbrev !== state.abbrev
	) {
		const editable = tid === g.get("userTid") && !g.get("spectator");
		const ratings = ["hgt", "stre", "spd", "endu", ...posRatings(pos)];
		const playersAll = await idb.cache.players.indexGetAll("playersByTid", tid);
		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["pid", "name", "age", "injury", "watch"],
			ratings: ["skills", "pos", "ovr", "pot", "ovrs", "pots", ...ratings],
			playoffs: playoffs === "playoffs",
			regularSeason: playoffs !== "playoffs",
			stats: [...stats[pos], "jerseyNumber"],
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});

		// Sort players based on current depth chart
		const t = await idb.cache.teams.get(tid);

		if (!t || !t.depth) {
			throw new Error("Missing depth");
		}

		const depthPlayers = team.getDepthPlayers(t.depth, players);

		const stats2: string[] = stats.hasOwnProperty(pos) ? stats[pos] : [];

		const players2: any[] = depthPlayers.hasOwnProperty(pos)
			? depthPlayers[pos]
			: [];

		let multiplePositionsWarning: string | undefined;
		if (isSport("hockey") && players.length >= g.get("minRosterSize")) {
			const playerInfoByPid = new Map<
				any,
				{
					name: string;
					positions: string[];
				}
			>();

			for (const [pos, posPlayers] of Object.entries(depthPlayers)) {
				const numStarters =
					(NUM_LINES as any)[pos] * (NUM_PLAYERS_PER_LINE as any)[pos];

				for (let i = 0; i < numStarters; i++) {
					const p = posPlayers[i];
					if (!p) {
						break;
					}

					const { name, pid } = p;
					let info = playerInfoByPid.get(pid);
					if (!info) {
						info = {
							name,
							positions: [] as string[],
						};
						playerInfoByPid.set(pid, info);
					}
					info.positions.push(pos);
				}
			}

			const playersAtMultiplePositions = [];
			for (const { name, positions } of playerInfoByPid.values()) {
				if (positions.length > 1) {
					playersAtMultiplePositions.push(`${name} (${positions.join("/")})`);
				}
			}

			if (playersAtMultiplePositions.length > 0) {
				multiplePositionsWarning = `Some players are in the rotation at multiple positions, which may lead to erratic substitution patterns: ${playersAtMultiplePositions.join(
					", ",
				)}.`;
			}
		}

		return {
			abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			editable,
			keepRosterSorted: t.keepRosterSorted,
			multiplePositionsWarning,
			pos,
			players: players2,
			playoffs,
			ratings,
			season: g.get("season"),
			stats: stats2,
			tid,
		};
	}
};

export default updateDepth;
