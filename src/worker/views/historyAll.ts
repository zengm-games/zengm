import { PHASE } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { groupByUnique, last, range } from "../../common/utils.ts";
import { formatAwardNamePrefix } from "../core/awards/prefixes.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { PlayersCache } from "../db/PlayersCache.ts";

const getAbbrev = (
	tid: number,
	teams: Record<
		number,
		{
			tid: number;
			abbrev: string;
			seasonAttrs: {
				abbrev: string;
				season: number;
			}[];
		}
	>,
	season: number,
) => {
	const t = teams[tid];
	if (!t) {
		return "???";
	}

	const seasonAttrs = t.seasonAttrs.find((ts) => ts.season === season);
	if (!seasonAttrs) {
		return t.abbrev;
	}

	return seasonAttrs.abbrev;
};

const updateHistory = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		(updateEvents.includes("newPhase") &&
			g.get("phase") === PHASE.DRAFT_LOTTERY)
	) {
		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid", "abbrev", "imgURL", "imgURLSmall"],
				seasonAttrs: [
					"season",
					"playoffRoundsWon",
					"won",
					"lost",
					"tied",
					"otl",
					"abbrev",
					"region",
					"name",
					"imgURL",
					"imgURLSmall",
				],
				addDummySeason: true,
			},
			"noCopyCache",
		);
		const teamsByTid = groupByUnique(teams, "tid");

		type MyTeam = (typeof teams)[number];
		const formatTeam = (
			t: MyTeam,
			season: number,
			seed: number | undefined,
		) => {
			const tid = t.tid;

			const teamSeason = t.seasonAttrs.find((ts) => ts.season === season);

			return {
				tid,
				seed,
				abbrev: teamSeason
					? teamSeason.abbrev
					: g.get("teamInfoCache")[tid]?.abbrev,
				region: teamSeason
					? teamSeason.region
					: g.get("teamInfoCache")[tid]?.region,
				name: teamSeason ? teamSeason.name : g.get("teamInfoCache")[tid]?.name,
				won: teamSeason ? teamSeason.won : 0,
				lost: teamSeason ? teamSeason.lost : 0,
				tied: teamSeason ? teamSeason.tied : 0,
				otl: teamSeason ? teamSeason.otl : 0,
				imgURL: teamSeason?.imgURL ?? t.imgURL,
				imgURLSmall:
					teamSeason?.imgURLSmall ?? teamSeason?.imgURL ?? t.imgURLSmall,
				count: 0,
			};
		};
		const formatTeamWrapper = (
			{
				seed,
				tid,
			}: {
				seed: number | undefined;
				tid: number;
			},
			season: number,
		) => {
			const t = teamsByTid[tid];
			if (!t) {
				throw new Error(`Team not found for tid ${tid}`);
			}

			return formatTeam(t, season, seed);
		};
		type FormattedTeam = ReturnType<typeof formatTeam>;

		const awards = await idb.getCopies.awards(undefined, "noCopyCache");
		const awardsBySeason = groupByUnique(awards, "season");

		// Start with the oldest season we have team or awards history for
		const maxSeason =
			g.get("phase") > PHASE.PLAYOFFS ? g.get("season") : g.get("season") - 1;
		let minSeason = Infinity;
		for (const t of teams) {
			if (t.seasonAttrs.length > 0 && t.seasonAttrs[0]!.season < minSeason) {
				minSeason = t.seasonAttrs[0]!.season;
			}
		}
		if (awards[0] && awards[0].season < minSeason) {
			minSeason = awards[0].season;
		}

		const awardTypes: {
			name: string;
			shortName: string;
		}[] = [];
		const seenAwardTypes = new Set();

		// Many players win multiple awards, so cache them rather than always reading from disk
		const playersCache = new PlayersCache();

		const seasons = await Promise.all(
			range(maxSeason, minSeason - 1).map(async (season) => {
				const a = awardsBySeason[season];

				let awards: {
					abbrev: string;
					awardName: string;
					awardShortName: string;
					count: number;
					name: string;
					pid: number;
					pos: string | undefined;
					tid: number;
				}[];
				if (a) {
					awards = (
						await Promise.all(
							a.awards
								.filter((award) => {
									// Only want individual awards
									return award.numTeams === undefined;
								})
								.filter((award) => {
									// Also skip any non-finals series MVP since there will be multiple of them
									return (
										typeof award.statRange !== "number" ||
										award.statRange === -1
									);
								})
								.map(async (award) => {
									const winner = award.winner[0];
									if (winner?.pid === undefined) {
										return;
									}
									const { pid, statOverrides } = winner;

									const p = await playersCache.get(pid);
									if (!p) {
										return;
									}

									const statRange = award.statRange;

									const p2 = await idb.getCopy.playersPlus(p, {
										attrs: ["name"],
										stats: ["tid"],
										playoffs:
											statRange === "playoffs" || typeof statRange === "number",
										regularSeason: statRange === undefined,
										combined: statRange === "combined",
										mergeStats: "totOnly",
										season,
										showNoStats: true,
									});
									if (!p2) {
										return;
									}

									// Manually add pos, since ratings could have been deleted or something
									const pos =
										p.ratings.findLast((row) => row.season === season)?.pos ??
										last(p.ratings).pos;
									p2.ratings = { pos };

									const tid = statOverrides?.tid ?? p2.stats.tid;

									const abbrev = getAbbrev(tid, teamsByTid, season);

									const awardName = formatAwardNamePrefix(award, season);
									const awardShortName = formatAwardNamePrefix(
										award,
										season,
										true,
									);

									if (!seenAwardTypes.has(awardShortName)) {
										seenAwardTypes.add(awardShortName);
										awardTypes.push({
											name: awardName,
											shortName: awardShortName,
										});
									}

									return {
										abbrev,
										awardName,
										awardShortName,
										count: 0,
										name: p2.name,
										pid,
										pos: bySport({
											baseball: p2.ratings.pos,
											basketball: undefined,
											football: p2.ratings.pos,
											hockey: p2.ratings.pos,
										}),
										tid,
									};
								}),
						)
					).filter((award) => award !== undefined);
				} else {
					awards = [];
				}

				const row = {
					season,
					runnerUp: undefined as FormattedTeam | undefined,
					champ: undefined as FormattedTeam | undefined,
					awards,
				};

				return row;
			}),
		);

		const playoffSeries = await idb.getCopies.playoffSeries(
			undefined,
			"noCopyCache",
		);
		const playoffSeriesBySeason = groupByUnique(playoffSeries, "season");

		for (const row of seasons) {
			const season = row.season;

			// Only check for finals result for seasons that are over
			const series = playoffSeriesBySeason[season];

			if (series) {
				const finalRound = series.series.at(-1);
				if (!finalRound) {
					// 0 length numGamesPlayoffSeries, no playoffs
					const t = teams.find((t) =>
						t.seasonAttrs.find(
							(ts) => ts.season === season && ts.playoffRoundsWon === 0,
						),
					);

					if (t) {
						row.champ = formatTeam(t, season, 1);
					}
				} else {
					const finals = finalRound[0];

					// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
					if (!finals || !finals.away) {
						continue;
					}

					let champ;
					let runnerUp;
					if (finals.home.won > finals.away.won) {
						champ = finals.home;
						runnerUp = finals.away;
					} else {
						champ = finals.away;
						runnerUp = finals.home;
					}

					row.champ = formatTeamWrapper(champ, season);
					row.runnerUp = formatTeamWrapper(runnerUp, season);
				}
			} else {
				// This is for people with some missing playoffSeries data, either because it was deleted or because it never existed (like adding teamSeasons manually for past years)
				const teamSeasons = await idb.getCopies.teamSeasons(
					{ season },
					"noCopyCache",
				);

				const numPlayoffRounds = g.get("numGamesPlayoffSeries", season).length;

				let champ;
				let runnerUp;
				for (const row of teamSeasons) {
					if (row.playoffRoundsWon === numPlayoffRounds) {
						champ = {
							seed: undefined,
							tid: row.tid,
						};
					} else if (row.playoffRoundsWon === numPlayoffRounds - 1) {
						runnerUp = {
							seed: undefined,
							tid: row.tid,
						};
					}

					if (champ && runnerUp) {
						break;
					}
				}

				if (champ) {
					row.champ = formatTeamWrapper(champ, season);
				}
				if (runnerUp) {
					row.runnerUp = formatTeamWrapper(runnerUp, season);
				}
			}
		}

		// Count up number of championships/awards per tid/pid
		const counts: {
			awards: Record<string, Record<number, number>>;
			champ: Record<number, number>;
			runnerUp: Record<number, number>;
		} = {
			awards: {},
			champ: {},
			runnerUp: {},
		};

		const teamCategories = ["champ", "runnerUp"] as const;
		for (const row of seasons.toReversed()) {
			for (const category of teamCategories) {
				if (!row[category]) {
					continue;
				}

				const tid = row[category].tid;
				const categoryCounts = counts[category];
				categoryCounts[tid] ??= 0;
				categoryCounts[tid] += 1;
				row[category].count = categoryCounts[tid];
			}

			for (const award of row.awards) {
				const shortName = award.awardShortName;
				const pid = award.pid;
				counts.awards[shortName] ??= {};
				counts.awards[shortName][pid] ??= 0;
				counts.awards[shortName][pid] += 1;
				award.count = counts.awards[shortName][pid];
			}
		}

		return {
			awards: awardTypes,
			seasons,
		};
	}
};

export default updateHistory;
