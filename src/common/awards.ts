import { helpers } from "./helpers.ts";
import { bySport } from "./sportFunctions.ts";
import type { Award2, PlayerAwardCustom } from "./types.ts";

export const formatPlayerAwardName = (
	// This is like PlayerAward but with only the required field specified so it can be used elsewhere easily
	award:
		| {
				type: string;
		  }
		| Pick<
				PlayerAwardCustom,
				"groupPrefix" | "name" | "numTeams" | "rank" | "type"
		  >,
) => {
	if (award.type === undefined) {
		const prefix =
			award.groupPrefix !== undefined ? `${award.groupPrefix} ` : "";
		if (award.numTeams === undefined) {
			return `${prefix}${award.name}`;
		}

		if (award.numTeams === 1) {
			return `${prefix}${award.name} Team`;
		}

		return `${prefix}${helpers.ordinal(award.rank)} Team ${award.name}`;
	}

	return award.type;
};

export const showStatsByType: Partial<Record<Award2["showStats"], string[]>> =
	bySport({
		baseball: {
			// keyStats formats W-L and slash line nicely
			overall: ["keyStats"],
			sp: ["keyStats"],
			rp: ["sv", "era", "ip"],
			offense: ["keyStats"],
			defense: ["keyStats"], // Showing actualy defensive stats would be annoying because arrays
		},
		basketball: {
			offense: ["pts", "trb", "ast"],
			defense: ["trb", "blk", "stl"],
		},
		football: {
			overall: ["keyStats"],
			defense: ["keyStats"],
			blocking: ["keyStats"],
		},
		hockey: {
			overall: ["keyStats", "ps"],
			defense: ["tk", "hit", "dps"],
			goalkeeping: ["gpGoalie", "gaa", "svPct", "gps"],
		},
	});
