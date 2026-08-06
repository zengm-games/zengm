import { helpers } from "./helpers.ts";
import type { DistributiveOmit, PlayerAward } from "./types.ts";

export const formatPlayerAwardName = (
	award: DistributiveOmit<PlayerAward, "season">,
) => {
	if (award.type === undefined) {
		if (award.numTeams === undefined) {
			return award.name;
		}

		if (award.numTeams === 1) {
			return `${award.name} Team`;
		}

		return `${helpers.ordinal(award.rank)} Team ${award.name}`;
	}

	return award.type;
};
