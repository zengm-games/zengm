import range from "lodash/range";
import { team } from "..";
import { idb } from "../../db";
import { g, random } from "../../util";
import isUntradable from "./isUntradable";
import makeItWork from "./makeItWork";
import processTrade from "./processTrade";
import summary from "./summary";
import type { TradeTeams, TradePickValues } from "../../../common/types";
import getPickValues from "./getPickValues";

const attempt = async (estValues: TradePickValues) => {
	const aiTids = range(g.get("numTeams")).filter(i => {
		return !g.get("userTids").includes(i);
	});

	if (aiTids.length === 0) {
		return false;
	}

	const tid = random.choice(aiTids);
	const otherTids = range(g.get("numTeams")).filter(i => {
		return i !== tid && !g.get("userTids").includes(i);
	});

	if (otherTids.length === 0) {
		return false;
	}

	const otherTid = random.choice(otherTids);
	const players = (
		await idb.getCopies.players({
			tid,
		})
	).filter(p => !isUntradable(p).untradable);
	const draftPicks = await idb.cache.draftPicks.indexGetAll(
		"draftPicksByTid",
		tid,
	);

	if (players.length === 0 && draftPicks.length === 0) {
		return false;
	}

	const r = Math.random();
	const pids: number[] = [];
	const dpids: number[] = [];

	if (r < 0.33 || draftPicks.length === 0) {
		pids.push(random.choice(players).pid);
	} else if (r < 0.67 || players.length === 0) {
		dpids.push(random.choice(draftPicks).dpid);
	} else {
		pids.push(random.choice(players).pid);
		dpids.push(random.choice(draftPicks).dpid);
	}

	const teams0: TradeTeams = [
		{
			dpids,
			dpidsExcluded: [],
			pids,
			pidsExcluded: [],
			tid,
		},
		{
			dpids: [],
			dpidsExcluded: [],
			pids: [],
			pidsExcluded: [],
			tid: otherTid,
		},
	];
	const teams = await makeItWork(teams0, false, estValues);

	if (!teams) {
		return false;
	}

	// Don't do trades of just picks, it's weird usually
	if (teams[0].pids.length === 0 && teams[1].pids.length === 0) {
		return false;
	}

	// Don't do trades for nothing, it's weird usually
	if (teams[1].pids.length === 0 && teams[1].dpids.length === 0) {
		return false;
	}

	const tradeSummary = await summary(teams);

	if (tradeSummary.warning) {
		return false;
	}

	// Make sure this isn't a really shitty trade
	const dv2 = await team.valueChange(
		teams[0].tid,
		teams[1].pids,
		teams[0].pids,
		teams[1].dpids,
		teams[0].dpids,
	);

	if (dv2 < -15) {
		return false;
	}

	const finalTids: [number, number] = [teams[0].tid, teams[1].tid];
	const finalPids: [number[], number[]] = [teams[0].pids, teams[1].pids];
	const finalDpids: [number[], number[]] = [teams[0].dpids, teams[1].dpids];
	await processTrade(tradeSummary, finalTids, finalPids, finalDpids);

	return true;
};

const betweenAiTeams = async () => {
	// aiTrades is a legacy option. Only pay attention to it if the new option is at its default value.
	if (g.get("aiTrades") === false && g.get("aiTradesFactor") === 1) {
		return false;
	}

	// If aiTradesFactor is not an integer, use the fractional part as a probability. Like for 3.5, 50% of the times it will be 3, and 50% will be 4.
	let numAttempts = Math.floor(g.get("aiTradesFactor"));
	const remainder = g.get("aiTradesFactor") % 1;
	if (remainder > 0 && Math.random() < remainder) {
		numAttempts += 1;
	}

	if (numAttempts > 0) {
		const estValues = await getPickValues();

		for (let i = 0; i < numAttempts; i++) {
			await attempt(estValues);
		}
	}
};

export default betweenAiTeams;
