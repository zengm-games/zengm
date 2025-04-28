import { bySport, PHASE, SIMPLE_AWARDS } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents, PlayoffSeriesTeam } from "../../common/types.ts";
import { groupByUnique, range } from "../../common/utils.ts";

const addAbbrev = (
	award: any,
	teams: {
		tid: number;
		abbrev: string;
		seasonAttrs: {
			abbrev: string;
			season: number;
		}[];
	}[],
	season: number,
) => {
	if (!award) {
		return;
	}

	const t = teams.find((t) => t.tid === award.tid);
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

		const awards = await idb.getCopies.awards(undefined, "noCopyCache");
		const awardsBySeason = groupByUnique(awards, "season");

		// Start with the oldest season we have team or awards history for
		const maxSeason =
			g.get("phase") > PHASE.PLAYOFFS ? g.get("season") : g.get("season") - 1;
		let minSeason = maxSeason;
		for (const t of teams) {
			if (t.seasonAttrs[0].season < minSeason) {
				minSeason = t.seasonAttrs[0].season;
			}
		}
		if (awards.length > 0 && awards[0].season < minSeason) {
			minSeason = awards[0].season;
		}

		// Would be nice to do this by sport, but too lazy
		const awardTypes = [
			"finalsMvp",
			"mvp",
			"dpoy",
			"dfoy",
			"goy",
			"smoy",
			"mip",
			"roy",
			"oroy",
			"droy",
			"poy",
			"rpoy",
		];

		const seasons: any[] = range(minSeason, maxSeason + 1).map((season) => {
			const a = awardsBySeason[season];

			const row: any = {
				season,
				runnerUp: undefined,
				champ: undefined,
			};

			for (const awardType of awardTypes) {
				row[awardType] = addAbbrev(a?.[awardType], teams, a.season);
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
			const formatTeam = (t: MyTeam, seed: number) => {
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

					let champ: PlayoffSeriesTeam;
					let runnerUp: PlayoffSeriesTeam;
					if (finals.home.won > finals.away.won) {
						champ = finals.home;
						runnerUp = finals.away;
					} else {
						champ = finals.away;
						runnerUp = finals.home;
					}

					const formatTeamWrapper = ({ seed, tid }: PlayoffSeriesTeam) => {
						const t = teams.find((t) => t.tid === tid);
						if (!t) {
							throw new Error(`Team not found for tid ${tid}`);
						}

						return formatTeam(t, seed);
					};

					row.champ = formatTeamWrapper(champ);
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
				if (counts[category][tid] === undefined) {
					counts[category][tid] = 0;
				}
				counts[category][tid] += 1;
				row[category].count = counts[category][tid];
			}

			for (const category of SIMPLE_AWARDS) {
				if (!row[category]) {
					continue;
				}

				const pid = row[category].pid;
				if (counts[category][pid] === undefined) {
					counts[category][pid] = 0;
				}
				counts[category][pid] += 1;
				row[category].count = counts[category][pid];
			}
		}

		const awardNames = bySport({
			baseball: ["finalsMvp", "mvp", "poy", "rpoy", "roy"],
			basketball: ["finalsMvp", "mvp", "dpoy", "smoy", "mip", "roy"],
			football: ["finalsMvp", "mvp", "dpoy", "oroy", "droy"],
			hockey: ["finalsMvp", "mvp", "dpoy", "dfoy", "goy", "roy"],
		});

		return {
			awards: awardNames,
			seasons,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHistory;
