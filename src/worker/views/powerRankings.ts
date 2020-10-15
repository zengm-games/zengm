import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { team } from "../core";
import { POSITIONS, RATINGS } from "../../common";

const otherToRanks = (
	teams: {
		other: Record<string, number>;
		otherCurrent: Record<string, number>;
	}[],
) => {
	for (const field of ["other", "otherCurrent"] as const) {
		for (const key of Object.keys(teams[0][field])) {
			const values = teams.map(t => t[field][key]);
			const sorted = values.slice().sort((a, b) => b - a);
			const ranks = values.map(value => sorted.indexOf(value) + 1);
			for (let i = 0; i < teams.length; i++) {
				teams[i][field][key] = ranks[i];
			}
		}
	}
};

const updatePowerRankings = async (
	{ season }: ViewInput<"powerRankings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(season === g.get("season") && updateEvents.includes("gameSim")) ||
		season !== state.season
	) {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "depth"],
			seasonAttrs: [
				"won",
				"lost",
				"tied",
				"lastTen",
				"abbrev",
				"region",
				"name",
			],
			stats: ["gp", "mov"],
			season,
			showNoStats: true,
		});

		// Calculate team ovr ratings
		const teamsWithRankings = await Promise.all(
			teams.map(async t => {
				let teamPlayers;

				if (g.get("season") === season) {
					teamPlayers = await idb.cache.players.indexGetAll(
						"playersByTid",
						t.tid,
					);
				} else {
					teamPlayers = await idb.getCopies.players({
						statsTid: t.tid,
					});
				}

				const ratings = ["ovr", "pos"];
				if (process.env.SPORT === "basketball") {
					ratings.push(...RATINGS);
				}

				teamPlayers = await idb.getCopies.playersPlus(teamPlayers, {
					attrs: ["tid", "injury"],
					ratings,
					stats: ["season", "tid"],
					season,
					showNoStats: g.get("season") === season,
					showRookies: g.get("season") === season,
					fuzz: true,
					tid: t.tid,
				});
				const teamPlayersCurrent = teamPlayers.filter(
					p => p.injury.gamesRemaining === 0,
				);

				const ovr = team.ovr(teamPlayers);
				const ovrCurrent = team.ovr(teamPlayersCurrent);

				// Calculate score

				// Start with MOV, scaled for games played
				let score = (t.stats.mov * t.stats.gp) / g.get("numGames");

				// Add estimated MOV from ovr (0/100 to -30/30)
				const estimatedMOV = ovr * 0.6 - 30;
				score += estimatedMOV;
				let winsLastTen = parseInt(t.seasonAttrs.lastTen.split("-")[0], 10);

				if (Number.isNaN(winsLastTen)) {
					winsLastTen = 0;
				}

				// Modulate point differential by recent record: +10 for 10-0 in last 10 and -10 for 0-10
				score += -10 + 2 * winsLastTen;

				const other: Record<string, number> = {};
				const otherCurrent: Record<string, number> = {};
				if (process.env.SPORT === "basketball") {
					for (const rating of RATINGS) {
						other[rating] = team.ovr(teamPlayers, {
							rating,
						});
						otherCurrent[rating] = team.ovr(teamPlayersCurrent, {
							rating,
						});
					}
				} else {
					for (const pos of POSITIONS) {
						if (pos === "KR" || pos === "PR") {
							continue;
						}
						other[pos] = team.ovr(teamPlayers, {
							pos,
						});
						otherCurrent[pos] = team.ovr(teamPlayersCurrent, {
							pos,
						});
					}
				}

				return {
					...t,
					score,
					ovr,
					ovrCurrent,
					other,
					otherCurrent,

					// Placeholder
					rank: -1,
				};
			}),
		);

		otherToRanks(teamsWithRankings);

		teamsWithRankings.sort((a, b) => b.score - a.score);

		for (let i = 0; i < teamsWithRankings.length; i++) {
			teamsWithRankings[i].rank = i + 1;
		}

		let ties = false;
		for (const t of teams) {
			if (t.seasonAttrs.tied > 0) {
				ties = true;
				break;
			}
		}

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			season,
			teams: teamsWithRankings,
			ties: g.get("ties", season) || ties,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePowerRankings;
