import type { IndividualRealTeamInfo, Team, RealTeamInfo } from "./types";

const POTENTIAL_OVERRIDES = [
	"abbrev",
	"region",
	"name",
	"pop",
	"colors",
	"jersey",
	"imgURL",
	"imgURLSmall",
] as const;

type MyTeam = Partial<Pick<Team, typeof POTENTIAL_OVERRIDES[number] | "srID">>;

const applyToObject = (t: MyTeam, realInfo: IndividualRealTeamInfo) => {
	let updated = false;
	let updatedImgURL = false;
	for (const key of POTENTIAL_OVERRIDES) {
		if (realInfo[key] && realInfo[key] !== (t as any)[key]) {
			(t as any)[key] = realInfo[key];
			updated = true;

			if (key === "imgURL") {
				updatedImgURL = true;
			}
		}
	}

	if (updatedImgURL && realInfo.imgURLSmall === undefined) {
		delete (t as any).imgURLSmall;
	}

	return updated;
};

const applyRealTeamInfo = (
	t: MyTeam,
	realTeamInfo: RealTeamInfo,
	season: number,
	options: {
		exactSeason?: boolean;

		// Would be nice to use seasonOverride like this, instead of season, for updating objects with a specified season already in them
		srIDOverride?: string;
	} = {},
) => {
	const srID = options.srIDOverride ?? t.srID;

	let updated = false;
	if (!realTeamInfo || !srID || !realTeamInfo[srID]) {
		return updated;
	}

	const realInfoRoot = realTeamInfo[srID];

	// Apply the base attributes first
	if (!options.exactSeason) {
		updated = applyToObject(t, realInfoRoot);
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
	const updated2 = applyToObject(t, realInfoSeason);

	return updated || updated2;
};

export default applyRealTeamInfo;
