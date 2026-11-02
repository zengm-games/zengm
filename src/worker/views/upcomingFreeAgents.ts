import { PHASE, PLAYER } from "../../common/constants.ts";
import { player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { groupByUnique } from "../../common/utils.ts";
import { addMood } from "./freeAgents.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { getSeasonState, validateSeason } from "../util/processInputs.ts";
import { getFirstUpcomingFreeAgentsSeason } from "../../common/seasons.ts";

const processInputs = (params: RouteParams<"upcomingFreeAgents">) => {
	const firstSeason = getFirstUpcomingFreeAgentsSeason(getSeasonState());

	return {
		season: Math.max(validateSeason(params.season), firstSeason),
	};
};

export default defineView({
	id: "upcomingFreeAgents",
	processInputs,
	load: async ({ inputs }) => {
		const stats = bySport({
			baseball: ["gp", "keyStats", "war"],
			basketball: ["min", "pts", "trb", "ast", "per"],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		} as const);

		const showActualFreeAgents =
			g.get("phase") === PHASE.RESIGN_PLAYERS &&
			g.get("season") === inputs.season;

		const playersRaw = showActualFreeAgents
			? await idb.merged.players.getAll({ tid: PLAYER.FREE_AGENT })
			: await idb.merged.players.getAll(
					{ tid: [0, Infinity] },
					{ filter: (p) => p.contract.exp === inputs.season },
				);
		const playersRawByPid = groupByUnique(playersRaw, "pid");

		const playersFiltered = await player.formatAll(playersRaw, {
			attrs: [
				"pid",
				"name",
				"firstName",
				"lastName",
				"abbrev",
				"tid",
				"age",
				"contract",
				"injury",
				"watch",
				"jerseyNumber",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats,
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});

		const playersWithContractDesired = playersFiltered.map((p) => {
			const pRaw = playersRawByPid[p.pid];
			if (!pRaw) {
				throw new Error(`Raw player not found for pid ${p.pid}`);
			}

			// Uses the raw player object, since player.genContract needs the full player
			const contractDesired = player.genContract(pRaw, false); // No randomization
			contractDesired.exp += inputs.season - g.get("season");

			return {
				...p,
				contractDesired,
			};
		});

		const players = addFirstNameShort(
			await addMood(
				playersWithContractDesired,
				playersRaw,
				(p) => p.contractDesired.amount,
			),
		);

		// Apply mood
		for (const p of players) {
			p.contractDesired.amount = p.mood.user.contractAmount / 1000;
		}

		const projectedPayroll = await team.getPayroll(
			g.get("userTid"),
			inputs.season,
		);
		const projectedCapSpace = g.get("salaryCap") - projectedPayroll;

		return {
			players,
			projectedCapSpace,
			season: inputs.season,
			stats,
		};
	},
});
