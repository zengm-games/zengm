import range from "lodash/range";
import { team } from "..";
import { idb } from "../../db";
import { g, random } from "../../util";
import isUntradable from "./isUntradable";
import makeItWork from "./makeItWork";
import processTrade from "./processTrade";
import summary from "./summary";
import { TradeTeams } from "../../../common/types";

const betweenAiTeams = async () => {
	if (!g.aiTrades) {
		return;
	}

	const aiTids = range(g.numTeams).filter(i => {
		return !g.userTids.includes(i);
	});

	if (aiTids.length === 0) {
		return;
	}

	const tid = random.choice(aiTids);
	const otherTids = range(g.numTeams).filter(i => {
		return i !== tid && !g.userTids.includes(i);
	});

	if (otherTids.length === 0) {
		return;
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
		return;
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
	const teams = await makeItWork(teams0, false);

	if (!teams) {
		return;
	}

	// Don't do trades of just picks, it's weird usually
	if (teams[0].pids.length === 0 && teams[1].pids.length === 0) {
		return;
	}

	// Don't do trades for nothing, it's weird usually
	if (teams[1].pids.length === 0 && teams[1].dpids.length === 0) {
		return;
	}

	const tradeSummary = await summary(teams);

	if (!tradeSummary.warning) {
		// Make sure this isn't a really shitty trade
		const dv2 = await team.valueChange(
			teams[0].tid,
			teams[1].pids,
			teams[0].pids,
			teams[1].dpids,
			teams[0].dpids,
		);

		if (dv2 < -15) {
			return;
		}

		const finalTids: [number, number] = [teams[0].tid, teams[1].tid];
		const finalPids: [number[], number[]] = [teams[0].pids, teams[1].pids];
		const finalDpids: [number[], number[]] = [teams[0].dpids, teams[1].dpids];
		await processTrade(tradeSummary, finalTids, finalPids, finalDpids);
	}
};

export default betweenAiTeams;
