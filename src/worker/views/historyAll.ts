import { bySport, PHASE, SIMPLE_AWARDS } from "../../common";
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
			attrs: ["tid", "abbrev", "imgURL"],
			seasonAttrs: [
				"season",
				"playoffRoundsWon",
				"won",
				"lost",
				"tied",
				"abbrev",
				"region",
				"name",
				"imgURL",
			],
			addDummySeason: true,
		});

		const awards = await idb.getCopies.awards();
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
						imgURL:
							teamSeason && teamSeason.imgURL ? teamSeason.imgURL : t.imgURL,
						count: 0,
					};
				};

				seasons[i].champ = formatTeam(champ);
				seasons[i].runnerUp = formatTeam(runnerUp);
			}
		}

		// Count up number of championships/awards per tid/pid
		const counts: Record<string, Record<number, number>> = {
			finalsMvp: {},
			mvp: {},
			dpoy: {},
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
			hockey: ["finalsMvp", "mvp", "dpoy", "goy", "roy"],
		});

		return {
			awards: awardNames,
			seasons,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHistory;
