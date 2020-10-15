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

		const teams = helpers
			.orderByWinp(
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
						"clinchedPlayoffs",
					],
					stats: ["pts", "oppPts", "mov"],
					season: inputs.season,
					showNoStats: true,
				}),
				inputs.season,
			)
			.map(t => ({
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

		const rankingGroups: {
			type: "league" | "conf" | "div";
			teams: typeof teams[];
		}[] = [
			{
				type: "league",
				teams: [teams],
			},
			{
				type: "conf",
				teams: confs.map(conf =>
					teams.filter(t => t.seasonAttrs.cid === conf.cid),
				),
			},
			{
				type: "div",
				teams: divs.map(div =>
					teams.filter(t => t.seasonAttrs.did === div.did),
				),
			},
		];

		for (const rankingGroup of rankingGroups) {
			for (const group of rankingGroup.teams) {
				for (let i = 0; i < group.length; i++) {
					const t = group[i];
					t.gb[rankingGroup.type] =
						i === 0 ? 0 : helpers.gb(group[0].seasonAttrs, t.seasonAttrs);
					t.rank[rankingGroup.type] = i + 1;
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
		for (const t of teams) {
			if (t.seasonAttrs.tied > 0) {
				ties = true;
				break;
			}
		}

		return {
			confs,
			divs,
			maxPlayoffSeed,
			numPlayoffByes,
			playoffsByConference,
			season: inputs.season,
			teams,
			ties: g.get("ties", inputs.season) || ties,
			type: inputs.type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateStandings;
