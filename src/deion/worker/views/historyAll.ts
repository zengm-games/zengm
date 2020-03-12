import { PHASE } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import { UpdateEvents, PlayoffSeriesTeam } from "../../common/types";

const updateHistory = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		(updateEvents.includes("newPhase") &&
			g.get("phase") === PHASE.DRAFT_LOTTERY)
	) {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev", "region", "name"],
			seasonAttrs: ["season", "playoffRoundsWon", "won", "lost", "tied"],
		});

		const awards = await idb.getCopies.awards();
		const awardNames =
			process.env.SPORT === "basketball"
				? ["finalsMvp", "mvp", "dpoy", "smoy", "mip", "roy"]
				: ["finalsMvp", "mvp", "dpoy", "oroy", "droy"];
		const seasons: any[] = awards.map(a => {
			return {
				season: a.season,
				finalsMvp: a.finalsMvp,
				mvp: a.mvp,
				dpoy: a.dpoy,
				smoy: a.smoy,
				mip: a.mip,
				roy: a.roy,
				oroy: a.oroy,
				droy: a.droy,
				runnerUp: undefined,
				champ: undefined,
			};
		});

		const playoffSeries = await idb.getCopies.playoffSeries();

		for (let i = 0; i < seasons.length; i++) {
			const season = seasons[i].season;

			// Only check for finals result for seasons that are over
			if (
				season < g.get("season") ||
				(season === g.get("season") && g.get("phase") > PHASE.PLAYOFFS)
			) {
				const series = playoffSeries.find(ps => ps.season === season);

				if (series) {
					const finals = series.series[series.series.length - 1][0];

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
						const teamSeason = teams[tid].seasonAttrs.find(
							ts => ts.season === season,
						);

						return {
							tid: tid,
							seed: seed,
							abbrev: g.get("teamAbbrevsCache")[tid],
							region: g.get("teamRegionsCache")[tid],
							name: g.get("teamNamesCache")[tid],
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
		}

		// Count up number of championships per team
		const championshipsByTid = Array(g.get("numTeams")).fill(0);

		for (let i = 0; i < seasons.length; i++) {
			if (seasons[i].champ) {
				championshipsByTid[seasons[i].champ.tid] += 1;
			}

			if (seasons[i].champ) {
				seasons[i].champ.count = championshipsByTid[seasons[i].champ.tid];
			}
		}

		return {
			awards: awardNames,
			seasons,
			teamAbbrevsCache: g.get("teamAbbrevsCache"),
			ties: g.get("ties"),
			userTid: g.get("userTid"),
		};
	}
};

export default updateHistory;
