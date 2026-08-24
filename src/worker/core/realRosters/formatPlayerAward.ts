import { defaultGameAttributes } from "../../../common/defaultGameAttributes.ts";
import type {
	GameAttributesLeague,
	PlayerAwardBuiltIn,
} from "../../../common/types.ts";
import { groupByUnique } from "../../../common/utils.ts";

export const getDefaultAwardsByShortName = () => {
	return groupByUnique(
		defaultGameAttributes.awards.map((award, index) => {
			return {
				award,
				index,
			};
		}),
		(row) => row.award.shortName,
	);
};

export const formatPlayerAward = (
	rawAward: {
		rank?: number;
		season: number;
		shortName: string;
	},
	defaultAwardsByShortName: Record<
		string,
		{
			award: GameAttributesLeague["awards"][number];
			index: number;
		}
	>,
): PlayerAwardBuiltIn => {
	const infoTemp = defaultAwardsByShortName[rawAward.shortName];
	if (!infoTemp) {
		throw new Error("Should never happen");
	}

	const info = infoTemp.award;
	const index = infoTemp.index;

	const extra: {
		numTeams?: number;
		actAs?: "mvp" | "roy";
	} = {};
	if (info.numTeams === undefined) {
		if (info.actAs !== undefined) {
			extra.actAs = info.actAs;
		}
	} else {
		extra.numTeams = info.numTeams;
	}

	return {
		season: rawAward.season,
		name: info.name,
		shortName: rawAward.shortName,
		index,
		rank: rawAward.rank ?? 1,
		...extra,
	};
};
