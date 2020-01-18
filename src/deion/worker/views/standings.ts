import { idb } from "../db";
import { g, helpers } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

const updateStandings = async (
	inputs: ViewInput<"standings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
		inputs.season !== state.season
	) {
		const playoffsByConference = g.get("confs").length === 2;
		const teams = helpers.orderByWinp(
			await idb.getCopies.teamsPlus({
				attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
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
				],
				season: inputs.season,
			}),
			inputs.season,
		);
		const numPlayoffTeams =
			2 ** g.get("numGamesPlayoffSeries").length - g.get("numPlayoffByes");
		const confs: {
			cid: number;
			name: string;
			divs: any[];
			teams: any[];
		}[] = [];

		for (let i = 0; i < g.get("confs").length; i++) {
			const playoffsRank: number[] = [];
			const confTeams: any[] = [];
			let j = 0;

			for (const t of teams) {
				if (g.get("confs")[i].cid === t.cid) {
					playoffsRank[t.tid] = j + 1; // Store ranks by tid, for use in division standings

					confTeams.push(helpers.deepCopy(t));
					confTeams[j].rank = j + 1;

					if (j === 0) {
						confTeams[j].gb = 0;
					} else {
						confTeams[j].gb = helpers.gb(
							confTeams[0].seasonAttrs,
							confTeams[j].seasonAttrs,
						);
					}

					confTeams[j].highlight = confTeams[j].tid === g.get("userTid");
					j += 1;
				}
			}

			confs.push({
				cid: g.get("confs")[i].cid,
				name: g.get("confs")[i].name,
				divs: [],
				teams: playoffsByConference ? confTeams : [],
			});

			for (const div of g.get("divs")) {
				if (div.cid === g.get("confs")[i].cid) {
					const divTeams: any[] = [];
					let k = 0;

					for (const t of teams) {
						if (div.did === t.did) {
							divTeams.push(helpers.deepCopy(t));

							if (k === 0) {
								divTeams[k].gb = 0;
							} else {
								divTeams[k].gb = helpers.gb(
									divTeams[0].seasonAttrs,
									divTeams[k].seasonAttrs,
								);
							}

							if (playoffsRank[divTeams[k].tid] <= numPlayoffTeams / 2) {
								divTeams[k].playoffsRank = playoffsRank[divTeams[k].tid];
							} else {
								divTeams[k].playoffsRank = null;
							}

							divTeams[k].highlight = divTeams[k].tid === g.get("userTid");
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

		const allTeams: any[] = [];

		if (!playoffsByConference) {
			// Fix playoffsRank if conferences don't matter
			for (let i = 0; i < teams.length; i++) {
				const t = teams[i];
				const div = confs[t.cid].divs.find(div2 => t.did === div2.did);

				if (div) {
					const t2 = div.teams.find(t3 => t.tid === t3.tid);

					if (t2) {
						t2.playoffsRank = i < numPlayoffTeams ? i + 1 : null;
					}
				}
			}

			// If playoffs are not done by conference (instead to 16 or whatever make it from full league), we need a ranked list of all teams to display.
			if (!playoffsByConference) {
				let j = 0;

				for (const t of teams) {
					allTeams.push(helpers.deepCopy(t));
					allTeams[j].rank = j + 1;

					if (j === 0) {
						allTeams[j].gb = 0;
					} else {
						allTeams[j].gb = helpers.gb(
							allTeams[0].seasonAttrs,
							allTeams[j].seasonAttrs,
						);
					}

					allTeams[j].highlight = allTeams[j].tid === g.get("userTid");
					j += 1;
				}
			}
		}

		return {
			allTeams,
			confs,
			numPlayoffTeams,
			playoffsByConference,
			season: inputs.season,
			ties: g.get("ties"),
		};
	}
};

export default updateStandings;
