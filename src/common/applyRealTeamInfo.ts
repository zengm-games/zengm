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
	let updated = false;
	if (!realTeamInfo || !t.srID || !realTeamInfo[t.srID]) {
		return updated;
	}

	const realInfoRoot = realTeamInfo[t.srID];

	// Apply the base attributes first
	if (!options.exactSeason) {
		for (const key of POTENTIAL_OVERRIDES) {
			if (realInfoRoot[key] && realInfoRoot[key] !== (t as any)[key]) {
				(t as any)[key] = realInfoRoot[key];
				updated = true;
			}
		}
	}

	// Need to add a season override?
	if (!realInfoRoot.seasons) {
		return updated;
	}

	const realInfoSeasons = realInfoRoot.seasons;

	// Available seasons that are less than or equal to the input season
	const seasons = Object.keys(realInfoSeasons)
		.map(x => parseInt(x))
		.filter(x => !Number.isNaN(x))
		.filter(x => x <= season);
	if (seasons.length === 0) {
		return updated;
	}

	// Max available season up to the input season
	const seasonToUse = Math.max(...seasons);
	if (options.exactSeason && season !== seasonToUse) {
		return updated;
	}
	const realInfoSeason = realInfoSeasons[seasonToUse];

	// Apply, like above
	for (const key of POTENTIAL_OVERRIDES) {
		if (realInfoSeason[key] && realInfoSeason[key] !== (t as any)[key]) {
			(t as any)[key] = realInfoSeason[key];
			updated = true;
		}
	}

	return updated;
};

export default applyRealTeamInfo;
