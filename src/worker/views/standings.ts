import { idb } from "../db";
import { g, helpers, orderTeams } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updateStandings = async (
	inputs: ViewInput<"standings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
		inputs.season !== state.season ||
		inputs.type !== state.type
	) {
		const confs = g.get("confs", inputs.season);
		const divs = g.get("divs", inputs.season);
		const numPlayoffByes = g.get("numPlayoffByes", inputs.season);

		const numPlayoffTeams =
			2 ** g.get("numGamesPlayoffSeries", inputs.season).length -
			numPlayoffByes;
		const playoffsByConference = confs.length === 2;
		const maxPlayoffSeed = playoffsByConference
			? numPlayoffTeams / 2
			: numPlayoffTeams;

		const teams = (
			await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				seasonAttrs: [
					"won",
					"lost",
					"tied",
					"otl",
					"winp",
					"wonHome",
					"lostHome",
					"tiedHome",
					"otlHome",
					"wonAway",
					"lostAway",
					"tiedAway",
					"otlAway",
					"wonDiv",
					"lostDiv",
					"tiedDiv",
					"otlDiv",
					"wonConf",
					"lostConf",
					"tiedConf",
					"otlConf",
					"lastTen",
					"streak",
					"cid",
					"did",
					"abbrev",
					"region",
					"name",
					"clinchedPlayoffs",
				],
				stats: ["pts", "oppPts", "gp"],
				season: inputs.season,
				showNoStats: true,
			})
		).map(t => ({
			...t,
			gb: {
				league: 0,
				conf: 0,
				div: 0,
			},
			rank: {
				playoffs: 0,
				league: 0,
				conf: 0,
				div: 0,
			},
		}));

		const rankingGroups: Record<"league" | "conf" | "div", typeof teams[]> = {
			league: [
				await orderTeams(teams, {
					season: inputs.season,
				}),
			],
			conf: await Promise.all(
				confs.map(conf =>
					orderTeams(
						teams.filter(t => t.seasonAttrs.cid === conf.cid),
						{ season: inputs.season },
					),
				),
			),
			div: await Promise.all(
				divs.map(div =>
					orderTeams(
						teams.filter(t => t.seasonAttrs.did === div.did),
						{ season: inputs.season },
					),
				),
			),
		};

		for (const type of helpers.keys(rankingGroups)) {
			for (const group of rankingGroups[type]) {
				for (let i = 0; i < group.length; i++) {
					const t = group[i];
					t.gb[type] =
						i === 0 ? 0 : helpers.gb(group[0].seasonAttrs, t.seasonAttrs);
					t.rank[type] = i + 1;
				}
			}
		}

		for (const t of teams) {
			t.rank.playoffs = playoffsByConference ? t.rank.conf : t.rank.league;
			if (t.rank.playoffs > maxPlayoffSeed) {
				t.rank.playoffs = -1;
			}
		}

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
			confs,
			divs,
			maxPlayoffSeed,
			numPlayoffByes,
			playoffsByConference,
			rankingGroups,
			season: inputs.season,
			ties: g.get("ties", inputs.season) || ties,
			otl: g.get("otl", inputs.season) || otl,
			type: inputs.type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateStandings;
