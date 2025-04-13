import { contractNegotiation, freeAgents } from "../index.ts";
import { helpers } from "../../util/index.ts";
import type { PhaseReturn } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";

const newPhaseFreeAgency = async (): Promise<PhaseReturn> => {
	// In case some weird situation results in games still in the schedule, clear them
	await idb.cache.schedule.clear();

	// Delete all current negotiations to resign players
	await contractNegotiation.cancelAll();

	await freeAgents.ensureEnoughPlayers();

	await freeAgents.normalizeContractDemands({ type: "freeAgentsOnly" });

	return {
		redirect: {
			url: helpers.leagueUrl(["free_agents"]),
			text: "View free agents",
		},
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseFreeAgency;
