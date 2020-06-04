import { PHASE } from "../../../common";
import addStatsRow from "./addStatsRow";
import setContract from "./setContract";
import { g, helpers, logEvent } from "../../util";
import type { Phase, Player, PlayerContract } from "../../../common/types";

const sign = (
	p: Player,
	tid: number,
	contract: PlayerContract,
	phase: Phase,
) => {
	p.tid = tid;
	p.gamesUntilTradable = Math.round(0.17 * g.get("numGames")); // 14 for basketball, 3 for football
	// Handle stats if the season is in progress

	if (phase <= PHASE.PLAYOFFS) {
		// Otherwise, not needed until next season
		addStatsRow(p, phase === PHASE.PLAYOFFS);
	}

	setContract(p, contract, true);
	const resigning =
		phase === PHASE.RESIGN_PLAYERS && p.draft.year !== g.get("season");
	const eventType = resigning ? "reSigned" : "freeAgent";
	const signedOrReSigned = resigning ? "Re-signed" : "Signed";
	logEvent({
		type: eventType,
		text: `${signedOrReSigned} <a href="${helpers.leagueUrl([
			"player",
			p.pid,
		])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(
			p.contract.amount / 1000,
			"M",
		)}/year through ${p.contract.exp}.`,
		showNotification: false,
		pids: [p.pid],
		tids: [p.tid],
		score: Math.round(helpers.bound(p.valueFuzz - 45, 0, Infinity)),
	});

	const isRookie =
		g.get("hardCap") &&
		p.stats.length === 0 &&
		p.draft.year === g.get("season") &&
		p.draft.tid === p.tid;
	const freeAgent = !resigning && !isRookie;
	if (freeAgent) {
		if (!p.transactions) {
			p.transactions = [];
		}
		p.transactions.push({
			season: g.get("season"),
			phase: g.get("phase"),
			tid: p.tid,
			type: "freeAgent",
		});
	}
};

export default sign;
