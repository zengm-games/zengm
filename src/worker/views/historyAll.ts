import { PHASE } from "../../common";
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
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev"],
			seasonAttrs: [
				"season",
				"playoffRoundsWon",
				"won",
				"lost",
				"tied",
				"abbrev",
				"region",
				"name",
			],
			addDummySeason: true,
		});

		const awards = await idb.getCopies.awards();
		const awardNames =
			process.env.SPORT === "basketball"
				? ["finalsMvp", "mvp", "dpoy", "smoy", "mip", "roy"]
				: ["finalsMvp", "mvp", "dpoy", "oroy", "droy"];
		const seasons: any[] = awards.map(a => {
			return {
				season: a.season,
				finalsMvp: addAbbrev(a.finalsMvp, teams, a.season),
				mvp: addAbbrev(a.mvp, teams, a.season),
				dpoy: addAbbrev(a.dpoy, teams, a.season),
				smoy: addAbbrev(a.smoy, teams, a.season),
				mip: addAbbrev(a.mip, teams, a.season),
				roy: addAbbrev(a.roy, teams, a.season),
				oroy: addAbbrev(a.oroy, teams, a.season),
				droy: addAbbrev(a.droy, teams, a.season),
				runnerUp: undefined,
				champ: undefined,
			};
		});

		const playoffSeries = await idb.getCopies.playoffSeries();

		for (let i = 0; i < seasons.length; i++) {
			const season = seasons[i].season;

			// Only check for finals result for seasons that are over
			const series = playoffSeries.find(ps => ps.season === season);

			if (series) {
				const finals = series.series[series.series.length - 1][0];

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

				const formatTeam = ({ seed, tid }: PlayoffSeriesTeam) => {
					const t = teams.find(t => t.tid === tid);
					if (!t) {
						throw new Error(`Team not found for tid ${tid}`);
					}
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
						count: 0,
					};
				};

				seasons[i].champ = formatTeam(champ);
				seasons[i].runnerUp = formatTeam(runnerUp);
			}
		}

		// Count up number of championships per team
		const championshipsByTid: Record<number, number> = {};

		for (const row of seasons) {
			if (row.champ) {
				const tid = row.champ.tid;
				if (championshipsByTid[tid] === undefined) {
					championshipsByTid[tid] = 0;
				}
				championshipsByTid[tid] += 1;
				row.champ.count = championshipsByTid[tid];
			}
		}

		return {
			awards: awardNames,
			seasons,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHistory;
