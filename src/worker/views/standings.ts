import { idb } from "../db";
import { g, helpers, orderTeams } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { getTiebreakers } from "../util/orderTeams";
import { season } from "../core";

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

		const numPlayoffTeams = await season.getNumPlayoffTeams(inputs.season);

		const playoffsByConf = await season.getPlayoffsByConf(inputs.season);
		const maxPlayoffSeed = playoffsByConf
			? numPlayoffTeams / 2
			: numPlayoffTeams;

		const pointsFormula = g.get("pointsFormula", inputs.season);
		const usePts = pointsFormula !== "";

		const teams = (
			await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				seasonAttrs: [
					"won",
					"lost",
					"tied",
					"otl",
					"winp",
					"pts",
					"ptsPct",
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
					"imgURL",
					"imgURLSmall",
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

		const orderTeamsOptions = {
			addTiebreakersField: true,
			season: inputs.season,
		};

		const rankingGroups = {
			league: [await orderTeams(teams, teams, orderTeamsOptions)],
			conf: await Promise.all(
				confs.map(conf =>
					orderTeams(
						teams.filter(t => t.seasonAttrs.cid === conf.cid),
						teams,
						orderTeamsOptions,
					),
				),
			),
			div: await Promise.all(
				divs.map(div =>
					orderTeams(
						teams.filter(t => t.seasonAttrs.did === div.did),
						teams,
						orderTeamsOptions,
					),
				),
			),
		};

		for (const type of helpers.keys(rankingGroups)) {
			for (const group of rankingGroups[type]) {
				for (let i = 0; i < group.length; i++) {
					const t = group[i];
					if (!usePts) {
						t.gb[type] =
							i === 0 ? 0 : helpers.gb(group[0].seasonAttrs, t.seasonAttrs);
					}
					t.rank[type] = i + 1;
				}
			}
		}

		for (const t of teams) {
			t.rank.playoffs = playoffsByConf ? t.rank.conf : t.rank.league;
			if (t.rank.playoffs > maxPlayoffSeed) {
				t.rank.playoffs = -1;
			}
		}

		// Don't show tiebreakers when everyone is tied 0-0
		let showTiebreakers = false;
		for (const t of teams) {
			if (
				t.seasonAttrs.won > 0 ||
				t.seasonAttrs.lost > 0 ||
				t.seasonAttrs.tied > 0 ||
				t.seasonAttrs.otl > 0
			) {
				showTiebreakers = true;
				break;
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

		const playIn =
			inputs.season === g.get("season")
				? g.get("playIn")
				: rankingGroups.league[0].some(
						t => t.seasonAttrs.clinchedPlayoffs === "w",
				  );

		return {
			confs,
			divs,
			maxPlayoffSeed,
			numPlayoffByes,
			playIn,
			playoffsByConf,
			pointsFormula,
			rankingGroups,
			season: inputs.season,
			showTiebreakers,
			ties: g.get("ties", inputs.season) || ties,
			otl: g.get("otl", inputs.season) || otl,
			tiebreakers: getTiebreakers(inputs.season),
			type: inputs.type,
			usePts,
			userTid: g.get("userTid"),
		};
	}
};

export default updateStandings;
