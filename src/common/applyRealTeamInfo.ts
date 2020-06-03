import type { Team, RealTeamInfo } from "./types";

const POTENTIAL_OVERRIDES = [
	"abbrev",
	"region",
	"name",
	"pop",
	"colors",
	"imgURL",
] as const;

const applyRealTeamInfo = (
	t: Partial<Pick<Team, typeof POTENTIAL_OVERRIDES[number] | "srID">>,
	realTeamInfo: RealTeamInfo,
	season: number,
	options: {
		exactSeason?: boolean;
	} = {},
) => {
	if (!realTeamInfo || !t.srID || !realTeamInfo[t.srID]) {
		return;
	}

	const realInfoRoot = realTeamInfo[t.srID];

	// Apply the base attributes first
	if (!options.exactSeason) {
		for (const key of POTENTIAL_OVERRIDES) {
			if (realInfoRoot[key]) {
				(t as any)[key] = realInfoRoot[key];
			}
		}
	}

	// Need to add a season override?
	if (!realInfoRoot.seasons) {
		return;
	}

	const realInfoSeasons = realInfoRoot.seasons;

	// Available seasons that are less than or equal to the input season
	const seasons = Object.keys(realInfoSeasons)
		.map(x => parseInt(x))
		.filter(x => !Number.isNaN(x))
		.filter(x => x <= season);
	if (seasons.length === 0) {
		return;
	}

	// Max available season up to the input season
	const seasonToUse = Math.max(...seasons);
	if (options.exactSeason && season !== seasonToUse) {
		return;
	}
	const realInfoSeason = realInfoSeasons[seasonToUse];

	// Apply, like above
	for (const key of POTENTIAL_OVERRIDES) {
		if (realInfoSeason[key]) {
			(t as any)[key] = realInfoSeason[key];
		}
	}
};

export default applyRealTeamInfo;
