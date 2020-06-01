import { contractNegotiation } from "..";
import { helpers } from "../../util";
import type { PhaseReturn } from "../../../common/types";

const newPhaseFreeAgency = async (): Promise<PhaseReturn> => {
	// Delete all current negotiations to resign players
	await contractNegotiation.cancelAll();

	return {
		url: helpers.leagueUrl(["free_agents"]),
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseFreeAgency;
