import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updateStandings = async (
	inputs: ViewInput<"standings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
		inputs.season !== state.season
	) {
		const currentConfs = g.get("confs", inputs.season);

		const playoffsByConference = currentConfs.length === 2;
		const teams = helpers.orderByWinp(
			await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				seasonAttrs: [
					"won",
					"lost",
					"tied",
					"winp",
					"wonHome",
					"lostHome",
					"tiedHome",
					"wonAway",
					"lostAway",
					"tiedAway",
					"wonDiv",
					"lostDiv",
					"tiedDiv",
					"wonConf",
					"lostConf",
					"tiedConf",
					"lastTen",
					"streak",
					"cid",
					"did",
					"abbrev",
					"region",
					"name",
				],
				season: inputs.season,
			}),
			inputs.season,
		);

		type StandingsTeam = typeof teams[number] & {
			gb: number;
			highlight: boolean;
			rank: number;
		};

		type DivTeam = typeof teams[number] & {
			gb: number;
			highlight: boolean;
			playoffsRank?: number;
		};

		const numPlayoffTeams =
			2 ** g.get("numGamesPlayoffSeries").length - g.get("numPlayoffByes");
		const confs: {
			cid: number;
			name: string;
			divs: {
				did: number;
				name: string;
				teams: DivTeam[];
			}[];
			teams: StandingsTeam[];
		}[] = [];

		for (let i = 0; i < currentConfs.length; i++) {
			const playoffsRank: number[] = [];
			const confTeams: StandingsTeam[] = [];
			let j = 0;

			for (const t of teams) {
				if (currentConfs[i].cid === t.seasonAttrs.cid) {
					playoffsRank[t.tid] = j + 1; // Store ranks by tid, for use in division standings

					const gb =
						j === 0 ? 0 : helpers.gb(confTeams[0].seasonAttrs, t.seasonAttrs);

					confTeams.push({
						...helpers.deepCopy(t),
						gb,
						highlight: t.tid === g.get("userTid"),
						rank: j + 1,
					});

					j += 1;
				}
			}

			confs.push({
				cid: currentConfs[i].cid,
				name: currentConfs[i].name,
				divs: [],
				teams: playoffsByConference ? confTeams : [],
			});

			for (const div of g.get("divs", inputs.season)) {
				if (div.cid === currentConfs[i].cid) {
					const divTeams: DivTeam[] = [];
					let k = 0;

					for (const t of teams) {
						if (div.did === t.seasonAttrs.did) {
							const gb =
								k === 0
									? 0
									: helpers.gb(divTeams[0].seasonAttrs, t.seasonAttrs);

							const rank =
								playoffsRank[t.tid] <= numPlayoffTeams / 2
									? playoffsRank[t.tid]
									: undefined;

							divTeams.push({
								...helpers.deepCopy(t),
								gb,
								highlight: t.tid === g.get("userTid"),
								playoffsRank: rank,
							});

							k += 1;
						}
					}

					confs[i].divs.push({
						did: div.did,
						name: div.name,
						teams: divTeams,
					});
				}
			}
		}

		const allTeams: StandingsTeam[] = [];

		if (!playoffsByConference) {
			// Fix playoffsRank if conferences don't matter
			for (let i = 0; i < teams.length; i++) {
				const t = teams[i];
				const div = confs[t.seasonAttrs.cid].divs.find(
					div2 => t.seasonAttrs.did === div2.did,
				);

				if (div) {
					const t2 = div.teams.find(t3 => t.tid === t3.tid);

					if (t2) {
						t2.playoffsRank = i < numPlayoffTeams ? i + 1 : undefined;
					}
				}
			}

			// If playoffs are not done by conference (instead to 16 or whatever make it from full league), we need a ranked list of all teams to display.
			if (!playoffsByConference) {
				let j = 0;

				for (const t of teams) {
					const gb =
						j === 0 ? 0 : helpers.gb(teams[0].seasonAttrs, t.seasonAttrs);

					allTeams.push({
						...helpers.deepCopy(t),
						gb,
						highlight: t.tid === g.get("userTid"),
						rank: j + 1,
					});

					j += 1;
				}
			}
		}

		return {
			confs,
			numPlayoffTeams,
			playoffsByConference,
			season: inputs.season,
			teams: allTeams,
			ties: g.get("ties"),
		};
	}
};

export default updateStandings;
