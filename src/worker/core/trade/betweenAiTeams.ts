import { team } from "..";
import { idb } from "../../db";
import { g, random, local } from "../../util";
import isUntradable from "./isUntradable";
import makeItWork from "./makeItWork";
import processTrade from "./processTrade";
import summary from "./summary";
import type { TradeTeams } from "../../../common/types";

const getAITids = async () => {
	const teams = await idb.cache.teams.getAll();
	return teams
		.filter(t => {
			if (t.disabled) {
				return false;
			}

			if (local.autoPlayUntil || g.get("spectator")) {
				return true;
			}
			return !g.get("userTids").includes(t.tid);
		})
		.map(t => t.tid);
};

const attempt = async (valueChangeKey: number) => {
	const aiTids = await getAITids();

	if (aiTids.length === 0) {
		return false;
	}

	const tid = random.choice(aiTids);
	const otherTids = aiTids.filter(tid2 => tid !== tid2);

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

	if ((r < 0.7 || draftPicks.length === 0) && players.length > 0) {
		// Weight by player value - good player more likely to be in trade
		pids.push(random.choice(players, p => p.value).pid);
	} else if ((r < 0.85 || players.length === 0) && draftPicks.length > 0) {
		dpids.push(random.choice(draftPicks).dpid);
	} else {
		pids.push(random.choice(players, p => p.value).pid);
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

	const teams = await makeItWork(teams0, false, valueChangeKey);

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
		valueChangeKey,
	);
	if (Math.abs(dv2) > 15) {
		return false;
	}

	const finalTids: [number, number] = [teams[0].tid, teams[1].tid];
	const finalPids: [number[], number[]] = [teams[0].pids, teams[1].pids];
	const finalDpids: [number[], number[]] = [teams[0].dpids, teams[1].dpids];
	await processTrade(tradeSummary, finalTids, finalPids, finalDpids);

	return true;
};

const DEFAULT_NUM_TEAMS = 30;

const betweenAiTeams = async () => {
	// aiTrades is a legacy option. Only pay attention to it if the new option is at its default value.
	if ((g as any).aiTrades === false && g.get("aiTradesFactor") === 1) {
		return false;
	}

	// If aiTradesFactor is not an integer, use the fractional part as a probability. Like for 3.5, 50% of the times it will be 3, and 50% will be 4.
	// Also scale so there are fewer trade attempts if there are fewer teams.
	let float = g.get("aiTradesFactor");
	if (g.get("numActiveTeams") < DEFAULT_NUM_TEAMS) {
		float *= g.get("numActiveTeams") / DEFAULT_NUM_TEAMS;
	}
	let numAttempts = Math.floor(float);
	const remainder = float % 1;
	if (remainder > 0 && Math.random() < remainder) {
		numAttempts += 1;
	}

	if (numAttempts > 0) {
		let valueChangeKey = Math.random();

		for (let i = 0; i < numAttempts; i++) {
			const tradeHappened = await attempt(valueChangeKey);
			if (tradeHappened) {
				valueChangeKey = Math.random();
			}
		}
	}
};

export default betweenAiTeams;
