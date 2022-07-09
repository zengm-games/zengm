import { player, team } from "../core";
import { idb } from "../db";
import { g } from "../util";
import posRatings from "../../common/posRatings";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { bySport, isSport } from "../../common";
import { NUM_LINES, NUM_PLAYERS_PER_LINE } from "../../common/constants.hockey";
import addFirstNameShort from "../util/addFirstNameShort";

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

const baseballLineupStats = [
	"war",
	"ab",
	"h",
	"hr",
	"ba",
	"r",
	"rbi",
	"sb",
	"obp",
	"slg",
	"ops",
];

export const buffOvrDH = (p: {
	ratings: {
		ovrs: {
			DH: number;
		};
		pots: {
			DH: number;
		};
	};
}) => {
	// For roster auto sort to work, it's best if DH is only the offensive component, so it is directly comparable to other positions. Otherwise you could wind up with a better offensive+defensive player winding up at DH, when you'd rather have him in the field. But then, displayed ovrs for DHs are really low. So adjust it with this.
	for (const key of ["ovrs", "pots"] as const) {
		if (p.ratings?.[key]?.DH !== undefined) {
			p.ratings[key].DH = player.limitRating((0.95 / 0.7) * p.ratings[key].DH);
		}
	}
};

const stats = bySport<Record<string, string[]>>({
	baseball: {
		L: baseballLineupStats,
		LP: baseballLineupStats,
		D: baseballLineupStats,
		DP: baseballLineupStats,
		P: ["war", "w", "l", "era", "gpPit", "gsPit", "sv", "ip", "soPit", "whip"],
	},
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
	if (!isSport("baseball") && !isSport("football") && !isSport("hockey")) {
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
		let showDH: "noDH" | "dh" | "both" | undefined;
		let pos2 = pos;
		if (isSport("baseball")) {
			const dh = g.get("dh");
			if (dh === "none") {
				showDH = "noDH";
			} else if (dh === "all") {
				showDH = "dh";
			} else {
				const confs = g.get("confs");
				const filteredConfs = confs.filter(conf => dh.includes(conf.cid));
				if (confs.length === filteredConfs.length) {
					showDH = "dh";
				} else if (filteredConfs.length === 0) {
					showDH = "noDH";
				} else {
					showDH = "both";
				}
			}

			if (showDH === "noDH") {
				if (pos === "L") {
					pos2 = "LP";
				} else if (pos === "D") {
					pos2 = "DP";
				}
			} else if (showDH === "dh") {
				if (pos === "LP") {
					pos2 = "L";
				} else if (pos === "DP") {
					pos2 = "D";
				}
			}
		}

		const editable = tid === g.get("userTid") && !g.get("spectator");
		const ratings = [
			...(isSport("baseball")
				? pos2 === "P"
					? []
					: ["hgt", "spd"]
				: ["hgt", "stre", "spd", "endu"]),
			...posRatings(pos2),
		];
		const playersAll = await idb.cache.players.indexGetAll("playersByTid", tid);
		const players = addFirstNameShort(
			await idb.getCopies.playersPlus(playersAll, {
				attrs: ["pid", "firstName", "lastName", "age", "injury", "watch"],
				ratings: ["skills", "pos", "ovr", "pot", "ovrs", "pots", ...ratings],
				playoffs: playoffs === "playoffs",
				regularSeason: playoffs !== "playoffs",
				stats: [...stats[pos2], "jerseyNumber"],
				season: g.get("season"),
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			}),
		);

		// Sort players based on current depth chart
		const t = await idb.cache.teams.get(tid);

		if (!t || !t.depth) {
			throw new Error("Missing depth");
		}

		const depthPlayers = team.getDepthPlayers(t.depth, players);

		const stats2: string[] = stats[pos2] ?? [];

		const players2: any[] = depthPlayers[pos2] ?? [];

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

					const { firstName, lastName, pid } = p;
					let info = playerInfoByPid.get(pid);
					if (!info) {
						info = {
							name: `${firstName} ${lastName}`,
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

		if (isSport("baseball")) {
			for (const p of players2) {
				buffOvrDH(p);
			}
		}

		return {
			abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			editable,
			keepRosterSorted: t.keepRosterSorted,
			multiplePositionsWarning,
			pos: pos2,
			players: players2,
			playoffs,
			ratings,
			season: g.get("season"),
			showDH,
			stats: stats2,
			tid,
		};
	}
};

export default updateDepth;
