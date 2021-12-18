import { PHASE } from "../../common";
import { idb } from "../db";
import g from "./g";
import type { TeamFiltered } from "../../common/types";
import advStatsSave from "./advStatsSave";

type Team = TeamFiltered<
	["tid"],
	["ptsDefault"],
	["gp", "min", "g", "a", "oppG", "sa"],
	number
>;

const OFFENSIVE_POSITIONS = ["C", "W"] as const;
const DEFENSIVE_POSITIONS = ["D"] as const;

const initSumByPosition = () => ({
	C: {
		pm: 0,
		min: 0,
	},
	W: {
		pm: 0,
		min: 0,
	},
	D: {
		pm: 0,
		min: 0,
	},
});

// Point Shares: https://www.hockey-reference.com/about/point_shares.html
const calculatePS = (players: any[], teams: Team[], league: any) => {
	const sumsByType = {
		forwards: {
			gc: 0,
			min: 0,
		},
		defensemen: {
			gc: 0,
			min: 0,
		},
	};
	const sumsByPosition: Record<number, any> = {};

	// Goals created
	const gc = players.map(p => {
		const t = teams.find(t => t.tid === p.tid);
		if (t === undefined) {
			throw new Error("Should never happen");
		}

		const gcDenominator = t.stats.g + 0.5 * t.stats.a;
		const gcPlayer =
			gcDenominator > 0
				? (p.stats.g + 0.5 * p.stats.a) * (t.stats.g / gcDenominator)
				: 0;

		if (OFFENSIVE_POSITIONS.includes(p.ratings.pos)) {
			sumsByType.forwards.gc += gcPlayer;
			sumsByType.forwards.min += p.stats.min;
		} else if (DEFENSIVE_POSITIONS.includes(p.ratings.pos)) {
			sumsByType.defensemen.gc += gcPlayer;
			sumsByType.defensemen.min += p.stats.min;
		}

		if (!sumsByPosition[t.tid]) {
			sumsByPosition[t.tid] = initSumByPosition();
		}
		if (sumsByPosition[t.tid][p.ratings.pos]) {
			sumsByPosition[t.tid][p.ratings.pos].pm += p.stats.pm;
			sumsByPosition[t.tid][p.ratings.pos].min += p.stats.min;
		}

		return gcPlayer;
	});

	// Offensive/defensive/goalie point shares
	const ops: number[] = [];
	const dps: number[] = [];
	const gps: number[] = [];

	for (let i = 0; i < players.length; i++) {
		const p = players[i];
		const t = teams.find(t => t.tid === p.tid);
		if (t === undefined) {
			throw new Error("Should never happen");
		}

		const marginalGoalsPerPoint = league.g / league.ptsDefault;

		if (p.ratings.pos === "G") {
			// Goalie point shares
			if (p.stats.min > 0 && league.saPerMin > 0 && marginalGoalsPerPoint > 0) {
				const shotsAgainstAdjustment =
					p.stats.sa / p.stats.min / league.saPerMin;
				const marginalGoalsAgainst =
					(1 + 7 / 12) *
						shotsAgainstAdjustment *
						p.stats.min *
						league.oppGPerPmin -
					p.stats.ga;
				gps[i] = (2 / 7) * (marginalGoalsAgainst / marginalGoalsPerPoint);
			} else {
				gps[i] = 0;
			}

			ops[i] = 0;
			dps[i] = 0;
		} else {
			if (marginalGoalsPerPoint > 0) {
				const type: keyof typeof sumsByType = OFFENSIVE_POSITIONS.includes(
					p.ratings.pos,
				)
					? "forwards"
					: "defensemen";

				// Offensive point shares
				const marginalGoals =
					gc[i] -
					(7 / 12) * p.stats.min * (sumsByType[type].gc / sumsByType[type].min);
				ops[i] = marginalGoals / marginalGoalsPerPoint;

				// Defensive point shares
				const proportionTeamMin = p.stats.min / t.stats.min;
				const proportionMarginalGoalsAgainstSkaters =
					(7 - 2 * (t.stats.sa / t.stats.min / league.saPerMin)) / 7;
				const positionAdjustment = type === "forwards" ? 5 / 7 : 10 / 7;
				const teamMarginalGoalsAgainst =
					(1 + 7 / 12) * t.stats.gp * league.gPerGame - t.stats.oppG;
				const plusMinusAdjustment =
					(1 / 7) *
					positionAdjustment *
					(p.stats.pm -
						p.stats.min *
							(sumsByPosition[t.tid][p.ratings.pos].pm /
								sumsByPosition[t.tid][p.ratings.pos].min));
				const marginalGoalsAgainst =
					proportionTeamMin *
						proportionMarginalGoalsAgainstSkaters *
						positionAdjustment *
						teamMarginalGoalsAgainst +
					plusMinusAdjustment;

				dps[i] = marginalGoalsAgainst / marginalGoalsPerPoint;
			} else {
				ops[i] = 0;
				dps[i] = 0;
			}

			gps[i] = 0;
		}
	}

	return {
		gc,
		ops,
		dps,
		gps,
	};
};

const advStats = async () => {
	const playoffs = PHASE.PLAYOFFS === g.get("phase");

	const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
		0, // Active players have tid >= 0
		Infinity,
	]);
	const players = await idb.getCopies.playersPlus(playersRaw, {
		attrs: ["pid", "tid"],
		stats: ["gp", "min", "g", "a", "sa", "ga", "pm"],
		ratings: ["pos"],
		season: g.get("season"),
		playoffs,
		regularSeason: !playoffs,
	});
	const teamStats = ["gp", "min", "g", "a", "oppG", "sa"] as const;
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			stats: teamStats,
			seasonAttrs: ["ptsDefault"],
			season: g.get("season"),
			playoffs,
			regularSeason: !playoffs,
			addDummySeason: true,
			active: true,
		},
		"noCopyCache",
	);
	const league: any = teams.reduce((memo: any, t) => {
		for (const key of teamStats) {
			if (memo.hasOwnProperty(key)) {
				memo[key] += t.stats[key];
			} else {
				memo[key] = t.stats[key];
			}
		}

		if (!memo.hasOwnProperty("ptsDefault")) {
			memo.ptsDefault = 0;
		}
		if (playoffs) {
			// Base off gp during the playoffs - 1 point per GP, because it'll add up to 2 after going through all teams
			memo.ptsDefault += t.stats.gp;
		} else {
			memo.ptsDefault += t.seasonAttrs.ptsDefault;
		}

		if (t.stats.gp > 0) {
			if (memo.hasOwnProperty("gPerGame")) {
				memo.gPerGame += t.stats.g / t.stats.gp;
			} else {
				memo.gPerGame = t.stats.g / t.stats.gp;
			}
		}

		return memo;
	}, {});
	league.min /= g.get("numPlayersOnCourt");
	league.saPerMin = league.sa / league.min;
	league.oppGPerPmin = league.oppG / league.min;
	league.gPerGame /= teams.filter(t => t.stats.gp > 0).length;

	const updatedStats = { ...calculatePS(players, teams, league) };
	await advStatsSave(players, playersRaw, updatedStats);
};

export default advStats;
