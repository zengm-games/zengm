import { team } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { Player, TradeSummary, TradeTeams } from "../../../common/types";
import orderBy from "lodash-es/orderBy";

const getTeamOvr = async (playersRaw: Player[]) => {
	const players = await idb.getCopies.playersPlus(playersRaw, {
		attrs: ["value", "pid"],
		fuzz: true,
		ratings: ["ovr", "pos", "ovrs"],
		season: g.get("season"),
	});

	return team.ovr(players);
};

/**
 * Create a summary of the trade, for eventual display to the user.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @return {Promise.Object} Resolves to an object contianing the trade summary.
 */
const summary = async (teams: TradeTeams): Promise<TradeSummary> => {
	const tids = [teams[0].tid, teams[1].tid];
	const pids = [teams[0].pids, teams[1].pids];
	const dpids = [teams[0].dpids, teams[1].dpids];
	const s: TradeSummary = {
		teams: [
			{
				name: "",
				ovrAfter: 0,
				ovrBefore: 0,
				payrollAfterTrade: 0,
				payrollBeforeTrade: 0,
				picks: [],
				total: 0,
				trade: [],
			},
			{
				name: "",
				ovrAfter: 0,
				ovrBefore: 0,
				payrollAfterTrade: 0,
				payrollBeforeTrade: 0,
				picks: [],
				total: 0,
				trade: [],
			},
		],
		warning: null,
	};

	// Calculate properties of the trade
	const playersAfter: [Player[], Player[]] = [[], []];
	for (const i of [0, 1] as const) {
		const playersBefore = await idb.cache.players.indexGetAll(
			"playersByTid",
			tids[i],
		);
		let players = orderBy(
			playersBefore.filter(p => pids[i].includes(p.pid)),
			"valueFuzz",
			"desc",
		);
		players = await idb.getCopies.playersPlus(players, {
			attrs: ["pid", "name", "contract", "draft"],
			season: g.get("season"),
			tid: tids[i],
			showRookies: true,
			showNoStats: true,
		});
		s.teams[i].trade = players;
		s.teams[i].total = s.teams[i].trade.reduce(
			(memo, p) => memo + p.contract.amount,
			0,
		);

		const picks = await idb.cache.draftPicks.indexGetAll(
			"draftPicksByTid",
			tids[i],
		);
		for (let j = 0; j < picks.length; j++) {
			if (dpids[i].includes(picks[j].dpid)) {
				s.teams[i].picks.push({
					dpid: picks[j].dpid,
					desc: await helpers.pickDesc(picks[j], "short"),
				});
			}
		}

		const j = i === 0 ? 1 : 0;
		s.teams[j].ovrBefore = await getTeamOvr(playersBefore);

		playersAfter[j].push(
			...playersBefore.filter(p => !pids[i].includes(p.pid)),
		);
		playersAfter[i].push(...playersBefore.filter(p => pids[i].includes(p.pid)));
	}
	for (const i of [0, 1] as const) {
		s.teams[i].ovrAfter = await getTeamOvr(playersAfter[i]);
	}

	const overCap = [false, false];
	const ratios = [0, 0];
	for (const j of [0, 1]) {
		const k = j === 0 ? 1 : 0;
		s.teams[j].name = `${g.get("teamInfoCache")[tids[j]]?.region} ${
			g.get("teamInfoCache")[tids[j]]?.name
		}`;

		if (s.teams[j].total > 0) {
			ratios[j] = Math.floor((100 * s.teams[k].total) / s.teams[j].total);
		} else if (s.teams[k].total > 0) {
			ratios[j] = Infinity;
		} else {
			ratios[j] = 100;
		}

		s.teams[j].payrollBeforeTrade = (await team.getPayroll(tids[j])) / 1000;
		s.teams[j].payrollAfterTrade =
			s.teams[j].payrollBeforeTrade + s.teams[k].total - s.teams[j].total;

		if (s.teams[j].payrollAfterTrade > g.get("salaryCap") / 1000) {
			overCap[j] = true;
		}
	}

	const softCapTradeSalaryMatch = g.get("softCapTradeSalaryMatch");

	const softCapCondition =
		g.get("salaryCapType") === "soft" &&
		((ratios[0] > softCapTradeSalaryMatch && overCap[0]) ||
			(ratios[1] > softCapTradeSalaryMatch && overCap[1]));

	const overCapAndIncreasing = (i: 0 | 1) =>
		overCap[i] && s.teams[i].payrollAfterTrade > s.teams[i].payrollBeforeTrade;

	const hardCapCondition =
		g.get("salaryCapType") === "hard" &&
		(overCapAndIncreasing(0) || overCapAndIncreasing(1));

	if (softCapCondition) {
		// Which team is at fault?;
		const j = ratios[0] > softCapTradeSalaryMatch ? 0 : 1;
		s.warning = `The ${s.teams[j].name} are over the salary cap, so the players it receives must have a combined salary of less than ${softCapTradeSalaryMatch}% of the salaries of the players it trades away.  Currently, that value is ${ratios[j]}%.`;
		s.warningAmount = ratios[j];
	} else if (hardCapCondition) {
		const j = overCapAndIncreasing(0) ? 0 : 1;
		const amountIncrease =
			s.teams[j].payrollAfterTrade - s.teams[j].payrollBeforeTrade;
		const amountOverCap =
			s.teams[j].payrollAfterTrade - g.get("salaryCap") / 1000;
		s.warning = `This trade is not allowed because it increases the payroll of the ${
			s.teams[j].name
		} by ${helpers.formatCurrency(
			amountIncrease,
			"M",
		)} and puts them over the salary cap by ${helpers.formatCurrency(
			amountOverCap,
			"M",
		)}.`;
		s.warningAmount = amountOverCap;
	}

	return s;
};

export default summary;
