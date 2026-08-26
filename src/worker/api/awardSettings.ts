import { defaultGameAttributes } from "../../common/defaultGameAttributes.ts";
import type { GameAttributesLeague } from "../../common/types.ts";
import { getAwardCandidates as getAwardCandidatesRaw } from "../core/awards/getAwardCandidates.ts";
import g from "../util/g.ts";

export const getAwardCandidates = async (
	info:
		| {
				type: "season";
				season: number;
		  }
		| {
				type: "default";
				season: number;
		  }
		| {
				type: "custom";
				season: number;
				awards: GameAttributesLeague["awards"];
		  },
) => {
	const season = info.season;
	const awards =
		info.type === "season"
			? g.get("awards")
			: info.type === "default"
				? defaultGameAttributes.awards
				: info.awards;
	return await getAwardCandidatesRaw(season, awards);
};
