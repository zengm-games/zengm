import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { TeamFiltered } from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import { player, team } from "../core/index.ts";
import {
	NOT_REAL_POSITIONS,
	POSITIONS,
	RATINGS,
} from "../../common/constants.ts";
import hasTies from "../core/season/hasTies.ts";
import { getActualPlayThroughInjuries } from "../core/game/loadTeams.ts";
import { PHASE } from "../../common/constants.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateSeason } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"powerRankings">) => {
	let playoffs: "playoffs" | "regularSeason" =
		g.get("phase") === PHASE.PLAYOFFS ? "playoffs" : "regularSeason";
	if (params.playoffs === "playoffs") {
		playoffs = "playoffs";
	} else if (params.playoffs === "regularSeason") {
		playoffs = "regularSeason";
	}

	return {
		playoffs,
		season: validateSeason(params.season),
	};
};

const otherToRanks = (
	teams: {
		powerRankings: {
			other: Record<string, number>;
			otherCurrent: Record<string, number>;
		};
	}[],
) => {
	if (!teams[0]) {
		return;
	}

	for (const field of ["other", "otherCurrent"] as const) {
		for (const key of Object.keys(teams[0].powerRankings[field])) {
			const values = teams.map((t) => t.powerRankings[field][key]!);
			const sorted = values.slice().sort((a, b) => b - a);
			const ranks = values.map((value) => sorted.indexOf(value) + 1);
			for (const [t, rank] of Iterator.zip([teams, ranks], {
				mode: "strict",
			})) {
				t.powerRankings[field][key] = rank;
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
	const currentSeason = g.get("season") === season;

	const formatOptions = {
		attrs: ["tid", "injury", "value", "age", "pid"],
		ratings: [
			"ovr",
			"pos",
			"ovrs",
			...(__SPORT === "basketball" ? RATINGS : []),
		],
		stats: ["season", "tid", "gp", "min"],
		season,
		showNoStats: currentSeason,
		showRookies: currentSeason,
		fuzz: true,
	} as const;
	const abbrevs = await player.loadAbbrevs(formatOptions);
	const formattersByTid = new Map(
		teams.map((t) => [
			t.tid,
			player.createFormatter({ ...formatOptions, tid: t.tid }, abbrevs),
		]),
	);

	// Read each player once and format them for every team they were on, rather than reading players separately for each team. In the current season, that's their current team. In past seasons, it's every team they have stats for that season.
	const rows = (
		await idb.merged.players.getAll(
			currentSeason ? { tid: [0, Infinity] } : { activeSeason: season },
			{
				map: (pRaw) => {
					const tids = currentSeason
						? [pRaw.tid]
						: new Set(
								pRaw.stats
									.filter((row) => row.season === season)
									.map((row) => row.tid),
							);

					const playerRows = [];
					for (const tid of tids) {
						const p = formattersByTid.get(tid)?.(pRaw);
						if (p) {
							playerRows.push({ tid, p });
						}
					}
					return playerRows;
				},
			},
		)
	).flat();
	const rowsByTid = Map.groupBy(rows, (row) => row.tid);

	// Calculate team ovr ratings
	const teamsWithRankings = teams.map((t) => {
		// Sorted by pid so ties in team.ovr are broken the same way regardless of which index the players were read from
		const teamPlayers = (rowsByTid.get(t.tid) ?? [])
			.map((row) => row.p)
			.sort((a, b) => a.pid - b.pid);

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
		if (__SPORT === "basketball") {
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
				if (NOT_REAL_POSITIONS.has(pos)) {
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
	});

	otherToRanks(teamsWithRankings);

	teamsWithRankings.sort(
		(a, b) => b.powerRankings.score - a.powerRankings.score,
	);

	for (const [i, t] of teamsWithRankings.entries()) {
		t.powerRankings.rank = i + 1;
	}

	return teamsWithRankings;
};

export default defineView({
	id: "powerRankings",
	processInputs,
	load: async ({ inputs: { playoffs, season }, updateEvents, prevInputs }) => {
		if (
			(season === g.get("season") && updateEvents.has("gameSim")) ||
			season !== prevInputs?.season ||
			playoffs !== prevInputs?.playoffs
		) {
			const teams = await team.getFormattedAll({
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
			});

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
				confs: g.get("confs", season),
				divs: g.get("divs", season),
				playoffs,
				season,
				teams: teamsWithRankings,
				ties: hasTies(season) || ties,
				otl: g.get("otl", season) || otl,
			};
		}
	},
});
