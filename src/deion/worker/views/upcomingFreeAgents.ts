import { PHASE, PLAYER } from "../../common";
import { player, freeAgents } from "../core";
import { idb } from "../db";
import { g } from "../util";
import { ViewInput } from "../../common/types";

const updateUpcomingFreeAgents = async (
	inputs: ViewInput<"upcomingFreeAgents">,
) => {
	const stats =
		process.env.SPORT === "basketball"
			? ["min", "pts", "trb", "ast", "per"]
			: ["gp", "keyStats", "av"];
	let players: any[] =
		g.get("phase") === PHASE.RESIGN_PLAYERS
			? await idb.getCopies.players({
					tid: PLAYER.FREE_AGENT,
			  })
			: await idb.getCopies.players({
					tid: [0, Infinity],
					filter: p => p.contract.exp === inputs.season,
			  }); // Done before filter so full player object can be passed to player.genContract.

	for (const p of players) {
		if (g.get("phase") === PHASE.RESIGN_PLAYERS) {
			p.contractDesired = {
				amount: p.contract.amount / 1000,
				exp: p.contract.exp,
			};
		} else {
			p.contractDesired = player.genContract(p, false, false); // No randomization
			p.contractDesired.amount /= 1000;
			p.contractDesired.exp += inputs.season - g.get("season");
		}
	}

	players = await idb.getCopies.playersPlus(players, {
		attrs: [
			"pid",
			"name",
			"abbrev",
			"age",
			"contract",
			"freeAgentMood",
			"injury",
			"contractDesired",
			"watch",
		],
		ratings: ["ovr", "pot", "skills", "pos"],
		stats,
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});

	// Apply mood
	for (const p of players) {
		p.contract.amount = freeAgents.amountWithMood(
			p.contract.amount,
			p.freeAgentMood[g.get("userTid")],
		);
		p.contractDesired.amount = freeAgents.amountWithMood(
			p.contractDesired.amount,
			p.freeAgentMood[g.get("userTid")],
		);
	}

	return {
		phase: g.get("phase"),
		players,
		season: inputs.season,
		stats,
	};
};

export default updateUpcomingFreeAgents;
