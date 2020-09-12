import { PHASE, PLAYER } from "../../common";
import { player } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type { ViewInput } from "../../common/types";

const updateUpcomingFreeAgents = async (
	inputs: ViewInput<"upcomingFreeAgents">,
) => {
	const stats =
		process.env.SPORT === "basketball"
			? ["min", "pts", "trb", "ast", "per"]
			: ["gp", "keyStats", "av"];

	const showActualFreeAgents =
		g.get("phase") === PHASE.RESIGN_PLAYERS &&
		g.get("season") === inputs.season;

	let players: any[] = showActualFreeAgents
		? await idb.getCopies.players({
				tid: PLAYER.FREE_AGENT,
		  })
		: await idb.getCopies.players({
				tid: [0, Infinity],
				filter: p => p.contract.exp === inputs.season,
		  });

	// Done before filter so full player object can be passed to player.genContract.
	for (const p of players) {
		p.contractDesired = player.genContract(p, false); // No randomization
		p.contractDesired.exp += inputs.season - g.get("season");

		p.mood = await player.moodInfo(p, g.get("userTid"), {
			contractAmount: p.contractDesired.amount,
		});
	}

	players = await idb.getCopies.playersPlus(players, {
		attrs: [
			"pid",
			"name",
			"abbrev",
			"tid",
			"age",
			"contract",
			"injury",
			"contractDesired",
			"watch",
			"jerseyNumber",
			"mood",
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
		p.contractDesired.amount = p.mood.contractAmount / 1000;
	}

	return {
		challengeNoRatings: g.get("challengeNoRatings"),
		phase: g.get("phase"),
		players,
		season: inputs.season,
		stats,
	};
};

export default updateUpcomingFreeAgents;
