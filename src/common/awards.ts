import { helpers } from "./helpers.ts";
import { bySport } from "./sportFunctions.ts";
import type { Award2, PlayerAwardBuiltIn } from "./types.ts";

export const formatPlayerAwardName = (
	// This is like PlayerAward but with only the required field specified so it can be used elsewhere easily
	award:
		| {
				type: string;
		  }
		| Pick<PlayerAwardBuiltIn, "name" | "numTeams" | "rank" | "type">,
	{
		groupPrefix,
		hideTeamName,
	}: {
		groupPrefix?: string; // Like for conf awards, prefix with conf abbrev
		hideTeamName?: boolean;
	} = {},
) => {
	if (award.type === undefined) {
		const prefixWithSpace = groupPrefix !== undefined ? `${groupPrefix} ` : "";
		if (award.numTeams === undefined) {
			return `${prefixWithSpace}${award.name}`;
		}

		if (award.numTeams === 1) {
			if (hideTeamName && groupPrefix !== undefined) {
				return groupPrefix;
			}
			return `${prefixWithSpace}${award.name} Team`;
		}

		const prefixAndRank = `${prefixWithSpace}${helpers.ordinal(award.rank)} Team`;
		if (hideTeamName) {
			return prefixAndRank;
		}

		return `${prefixAndRank} ${award.name}`;
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
