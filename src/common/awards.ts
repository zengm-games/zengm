import { helpers } from "./helpers.ts";
import { bySport } from "./sportFunctions.ts";
import type { Award2, PlayerAwardCustom } from "./types.ts";

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

export const showStatsByType: Partial<Record<Award2["showStats"], string[]>> =
	bySport({
		baseball: {
			overall: ["keyStats", "war"],
			sp: ["w", "l", "era", "ip", "rpit"],
			rp: ["sv", "era", "ip", "rpit"],
			offense: ["pa", "hr", "ba", "ops", "war"],
		},
		basketball: {
			offense: ["pts", "trb", "ast"],
			defense: ["trb", "blk", "stl"],
		},
		football: {
			overall: ["keyStats", "av"],
			defense: ["defTck", "defSk", "defPssDef", "defInt", "av"],
			blocking: ["pbw", "pbwr", "rbw", "rbwr", "av"],
		},
		hockey: {
			overall: ["keyStats", "ps"],
			defense: ["tk", "hit", "dps"],
			goalkeeping: ["gpGoalie", "gaa", "svPct", "gps"],
		},
	});
