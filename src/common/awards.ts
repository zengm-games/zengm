import { helpers } from "./helpers.ts";
import type { PlayerAwardCustom } from "./types.ts";

export const formatPlayerAwardName = (
	// This is like PlayerAward but with only the required field specified so it can be used elsewhere easily
	award:
		| {
				type: string;
		  }
		| Pick<PlayerAwardCustom, "name" | "numTeams" | "rank" | "type">,
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
