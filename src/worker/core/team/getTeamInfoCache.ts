import type { GameAttributesLeague } from "../../../common/types.ts";

export const getTeamInfoCache = (
	teams: {
		abbrev: string;
		disabled?: boolean;
		imgURL?: string;
		imgURLSmall?: string;
		name: string;
		region: string;
	}[],
): GameAttributesLeague["teamInfoCache"] => {
	return teams.map((t) => ({
		abbrev: t.abbrev,
		disabled: t.disabled,
		imgURL: t.imgURL,
		imgURLSmall: t.imgURLSmall,
		name: t.name,
		region: t.region,
	}));
};
