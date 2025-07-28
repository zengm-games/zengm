import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type {
	TeamFiltered,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts";
import { team } from "../core/index.ts";
import {
	NOT_REAL_POSITIONS,
	POSITIONS,
	RATINGS,
	isSport,
} from "../../common/index.ts";
import hasTies from "../core/season/hasTies.ts";
import { getActualPlayThroughInjuries } from "../core/game/loadTeams.ts";

const otherToRanks = (
	teams: {
		powerRankings: {
			other: Record<string, number>;
			otherCurrent: Record<string, number>;
		};
	}[],
) => {
	if (teams.length === 0) {
		return;
	}

	for (const field of ["other", "otherCurrent"] as const) {
		for (const key of Object.keys(teams[0]!.powerRankings[field])) {
			const values = teams.map((t) => t.powerRankings[field][key]!);
			const sorted = values.slice().sort((a, b) => b - a);
			const ranks = values.map((value) => sorted.indexOf(value) + 1);
			for (const [i, t] of teams.entries()) {
				t.powerRankings[field][key] = ranks[i]!;
			}
		}
	}
};

export const addPowerRankingsStuffToTeams = async <
	T extends TeamFiltered<
		["playThroughInjuries", "tid"],
		["lastTen"],
		["gp", "mov"],
		number
	>,
>(
	teams: T[],
	season: number,
	playoffs: "regularSeason" | "playoffs",
) => {
	// Calculate team ovr ratings
	const teamsWithRankings = await Promise.all(
		teams.map(async (t) => {
			let teamPlayers;

			if (g.get("season") === season) {
				teamPlayers = await idb.cache.players.indexGetAll(
					"playersByTid",
					t.tid,
				);
			} else {
				teamPlayers = await idb.getCopies.players(
					{
						activeSeason: season,
						statsTid: t.tid,
					},
					"noCopyCache",
				);
			}

			const ratings = ["ovr", "pos", "ovrs"];
			if (isSport("basketball")) {
				ratings.push(...RATINGS);
			}

			teamPlayers = await idb.getCopies.playersPlus(teamPlayers, {
				attrs: ["tid", "injury", "value", "age", "pid"],
				ratings,
				stats: ["season", "tid", "gp", "min"],
				season,
				showNoStats: g.get("season") === season,
				showRookies: g.get("season") === season,
				fuzz: true,
				tid: t.tid,
			});

			const playThroughInjuries = getActualPlayThroughInjuries(t);

			const ovr = team.ovr(teamPlayers, {
				playoffs: playoffs === "playoffs",
			});
			const ovrCurrent = team.ovr(teamPlayers, {
				accountForInjuredPlayers: {
					numDaysInFuture: 0,
					playThroughInjuries,
				},
				playoffs: playoffs === "playoffs",
			});

			// Calculate score

			// Start with MOV, scaled for games played
			let score = (t.stats.mov * t.stats.gp) / g.get("numGames");

			// Add estimated MOV from ovr (0/100 to -30/30)
			const estimatedMOV = ovr * 0.6 - 30;
			score += estimatedMOV;
			let winsLastTen = Number.parseInt(t.seasonAttrs.lastTen.split("-")[0]!);

			if (Number.isNaN(winsLastTen)) {
				winsLastTen = 0;
			}

			// Modulate point differential by recent record: +10 for 10-0 in last 10 and -10 for 0-10
			score += -10 + 2 * winsLastTen;

			const other: Record<string, number> = {};
			const otherCurrent: Record<string, number> = {};
			if (isSport("basketball")) {
				for (const rating of RATINGS) {
					other[rating] = team.ovr(teamPlayers, {
						playoffs: playoffs === "playoffs",
						rating,
					});
					otherCurrent[rating] = team.ovr(teamPlayers, {
						accountForInjuredPlayers: {
							numDaysInFuture: 0,
							playThroughInjuries,
						},
						playoffs: playoffs === "playoffs",
						rating,
					});
				}
			} else {
				for (const pos of POSITIONS) {
					if (NOT_REAL_POSITIONS.includes(pos)) {
						continue;
					}
					other[pos] = team.ovr(teamPlayers, {
						playoffs: playoffs === "playoffs",
						onlyPos: pos,
					});
					otherCurrent[pos] = team.ovr(teamPlayers, {
						accountForInjuredPlayers: {
							numDaysInFuture: 0,
							playThroughInjuries,
						},
						playoffs: playoffs === "playoffs",
						onlyPos: pos,
					});
				}
			}

			return {
				...t,
				powerRankings: {
					score,
					ovr,
					ovrCurrent,
					other,
					otherCurrent,
					avgAge: team.avgAge(teamPlayers),

					// Placeholder
					rank: -1,
				},
			};
		}),
	);

	otherToRanks(teamsWithRankings);

	teamsWithRankings.sort(
		(a, b) => b.powerRankings.score - a.powerRankings.score,
	);

	for (const [i, t] of teamsWithRankings.entries()) {
		t.powerRankings.rank = i + 1;
	}

	return teamsWithRankings;
};

const updatePowerRankings = async (
	{ playoffs, season }: ViewInput<"powerRankings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(season === g.get("season") && updateEvents.includes("gameSim")) ||
		season !== state.season ||
		playoffs !== state.playoffs
	) {
		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid", "depth", "playThroughInjuries"],
				seasonAttrs: [
					"won",
					"lost",
					"tied",
					"otl",
					"lastTen",
					"abbrev",
					"region",
					"name",
					"cid",
					"did",
					"imgURL",
					"imgURLSmall",
				],
				stats: ["gp", "mov", "pts", "oppPts"],
				season,
				showNoStats: true,
			},
			"noCopyCache",
		);

		const teamsWithRankings = await addPowerRankingsStuffToTeams(
			teams,
			season,
			playoffs,
		);

		let ties = false;
		let otl = false;
		for (const t of teams) {
			if (t.seasonAttrs.tied > 0) {
				ties = true;
			}
			if (t.seasonAttrs.otl > 0) {
				otl = true;
			}
			if (ties && otl) {
				break;
			}
		}

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			confs: g.get("confs", season),
			divs: g.get("divs", season),
			playoffs,
			season,
			teams: teamsWithRankings,
			ties: hasTies(season) || ties,
			otl: g.get("otl", season) || otl,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePowerRankings;
