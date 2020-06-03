import type { Team, RealTeamInfo } from "../../../common/types";

const POTENTIAL_OVERRIDES = [
	"abbrev",
	"region",
	"name",
	"pop",
	"colors",
	"imgURL",
] as const;

const applyRealInfo = (t: Team, realTeamInfo: RealTeamInfo, season: number) => {
	if (!realTeamInfo || !t.srID || !realTeamInfo[t.srID]) {
		console.log(t.srID, "return 1");
		return;
	}

	const realInfoRoot = realTeamInfo[t.srID];

	// Apply the base attributes first
	for (const key of POTENTIAL_OVERRIDES) {
		if (realInfoRoot[key]) {
			(t as any)[key] = realInfoRoot[key];
		}
	}

	// Need to add a season override?
	if (!realInfoRoot.seasons) {
		console.log(t.srID, "return 2");
		return;
	}

	const realInfoSeasons = realInfoRoot.seasons;

	// Available seasons that are less than or equal to the input season
	const seasons = Object.keys(realInfoSeasons)
		.map(x => parseInt(x))
		.filter(x => !Number.isNaN(x))
		.filter(x => x <= season);
	if (seasons.length === 0) {
		console.log(t.srID, "return 3");
		return;
	}

	// Max available season up to the input season
	const seasonToUse = Math.max(...seasons);
	const realInfoSeason = realInfoSeasons[seasonToUse];

	// Apply, like above
	for (const key of POTENTIAL_OVERRIDES) {
		if (realInfoSeason[key]) {
			(t as any)[key] = realInfoSeason[key];
		}
	}
};

export default applyRealInfo;
