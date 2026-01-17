import { bySport, PHASE, SIMPLE_AWARDS } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { groupByUnique, range } from "../../common/utils.ts";

const addAbbrev = (
	award: any,
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
	if (!award) {
		return;
	}

	const t = teams[award.tid];
	if (!t) {
		return {
			...award,
			abbrev: "???",
		};
	}

	const seasonAttrs = t.seasonAttrs.find((ts) => ts.season === season);
	if (!seasonAttrs) {
		return {
			...award,
			abbrev: t.abbrev,
		};
	}

	return {
		...award,
		abbrev: seasonAttrs.abbrev,
	};
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
		if (awards.length > 0 && awards[0].season < minSeason) {
			minSeason = awards[0].season;
		}

		const awardTypes = bySport({
			baseball: ["finalsMvp", "mvp", "poy", "rpoy", "roy"],
			basketball: ["finalsMvp", "mvp", "dpoy", "smoy", "mip", "roy"],
			football: ["finalsMvp", "mvp", "dpoy", "oroy", "droy"],
			hockey: ["finalsMvp", "mvp", "dpoy", "dfoy", "goy", "roy"],
		});

		const seasons: any[] = range(minSeason, maxSeason + 1).map((season) => {
			const a = awardsBySeason[season];

			const row: any = {
				season,
				runnerUp: undefined,
				champ: undefined,
			};

			for (const awardType of awardTypes) {
				row[awardType] = a
					? addAbbrev(a[awardType], teamsByTid, a.season)
					: undefined;
			}

			return row;
		});

		const playoffSeries = await idb.getCopies.playoffSeries(
			undefined,
			"noCopyCache",
		);
		const playoffSeriesBySeason = groupByUnique(playoffSeries, "season");

		for (const row of seasons) {
			const season = row.season;

			// Only check for finals result for seasons that are over
			const series = playoffSeriesBySeason[season];

			type MyTeam = (typeof teams)[number];
			const formatTeam = (t: MyTeam, seed: number | undefined) => {
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
					name: teamSeason
						? teamSeason.name
						: g.get("teamInfoCache")[tid]?.name,
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
			const formatTeamWrapper = ({
				seed,
				tid,
			}: {
				seed: number | undefined;
				tid: number;
			}) => {
				const t = teamsByTid[tid];
				if (!t) {
					throw new Error(`Team not found for tid ${tid}`);
				}

				return formatTeam(t, seed);
			};

			if (series) {
				if (series.series.length === 0) {
					// 0 length numGamesPlayoffSeries, no playoffs
					const t = teams.find((t) =>
						t.seasonAttrs.find(
							(ts) => ts.season === season && ts.playoffRoundsWon === 0,
						),
					);

					if (t) {
						row.champ = formatTeam(t, 1);
					}
				} else {
					const finals = series.series.at(-1)![0];

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

					row.champ = formatTeamWrapper(champ);
					row.runnerUp = formatTeamWrapper(runnerUp);
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
					row.champ = formatTeamWrapper(champ);
				}
				if (runnerUp) {
					row.runnerUp = formatTeamWrapper(runnerUp);
				}
			}
		}

		// Count up number of championships/awards per tid/pid
		const counts: Record<string, Record<number, number>> = {
			runnerUp: {},
			champ: {},
		};
		for (const award of SIMPLE_AWARDS) {
			counts[award] = {};
		}

		const teamCategories = ["champ", "runnerUp"];
		for (const row of seasons) {
			for (const category of teamCategories) {
				if (!row[category]) {
					continue;
				}

				const tid = row[category].tid;
				const categoryCounts = counts[category]!;
				if (categoryCounts[tid] === undefined) {
					categoryCounts[tid] = 0;
				}
				categoryCounts[tid] += 1;
				row[category].count = categoryCounts[tid];
			}

			for (const category of SIMPLE_AWARDS) {
				if (!row[category]) {
					continue;
				}

				const pid = row[category].pid;
				const categoryCounts = counts[category]!;
				if (categoryCounts[pid] === undefined) {
					categoryCounts[pid] = 0;
				}
				categoryCounts[pid] += 1;
				row[category].count = categoryCounts[pid];
			}
		}

		return {
			awards: awardTypes,
			seasons,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHistory;
