import { bySport, PHASE } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, PlayoffSeriesTeam } from "../../common/types";

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

	const t = teams.find(t => t.tid === award.tid);
	if (!t) {
		return {
			...award,
			abbrev: "???",
		};
	}

	const seasonAttrs = t.seasonAttrs.find(ts => ts.season === season);
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
		const seasons: any[] = awards.map(a => {
			return {
				season: a.season,
				finalsMvp: addAbbrev(a.finalsMvp, teams, a.season),
				mvp: addAbbrev(a.mvp, teams, a.season),
				dpoy: addAbbrev(a.dpoy, teams, a.season),
				dfoy: addAbbrev(a.dfoy, teams, a.season),
				goy: addAbbrev(a.goy, teams, a.season),
				smoy: addAbbrev(a.smoy, teams, a.season),
				mip: addAbbrev(a.mip, teams, a.season),
				roy: addAbbrev(a.roy, teams, a.season),
				oroy: addAbbrev(a.oroy, teams, a.season),
				droy: addAbbrev(a.droy, teams, a.season),
				runnerUp: undefined,
				champ: undefined,
			};
		});

		const playoffSeries = await idb.getCopies.playoffSeries(
			undefined,
			"noCopyCache",
		);

		for (let i = 0; i < seasons.length; i++) {
			const season = seasons[i].season;

			// Only check for finals result for seasons that are over
			const series = playoffSeries.find(ps => ps.season === season);

			type MyTeam = typeof teams[number];
			const formatTeam = (t: MyTeam, seed: number) => {
				const tid = t.tid;

				const teamSeason = t.seasonAttrs.find(ts => ts.season === season);

				return {
					tid: tid,
					seed: seed,
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
					const t = teams.find(t =>
						t.seasonAttrs.find(
							ts => ts.season === season && ts.playoffRoundsWon === 0,
						),
					);

					if (t) {
						seasons[i].champ = formatTeam(t, 1);
					}
				} else {
					const finals = series.series.at(-1)[0];

					// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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
						const t = teams.find(t => t.tid === tid);
						if (!t) {
							throw new Error(`Team not found for tid ${tid}`);
						}

						return formatTeam(t, seed);
					};

					seasons[i].champ = formatTeamWrapper(champ);
					seasons[i].runnerUp = formatTeamWrapper(runnerUp);
				}
			}
		}

		// Count up number of championships/awards per tid/pid
		const counts: Record<string, Record<number, number>> = {
			finalsMvp: {},
			mvp: {},
			dpoy: {},
			dfoy: {},
			goy: {},
			smoy: {},
			mip: {},
			roy: {},
			oroy: {},
			droy: {},
			runnerUp: {},
			champ: {},
		};

		const teamCategories = ["champ", "runnerUp"];
		const playerCategories = [
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
		];
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

			for (const category of playerCategories) {
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
