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

type MyTeam = Partial<
	Pick<Team, (typeof POTENTIAL_OVERRIDES)[number] | "srID">
>;

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
		// Would be nice to use seasonOverride like this, instead of season, for updating objects with a specified season already in them
		srIDOverride?: string;

		// When true, only do something if this season is explicitly listed in the real team info, otherwise assume prior values were correctly applied
		exactSeason?: boolean;
	} = {},
) => {
	const srID = options.srIDOverride ?? t.srID;

	if (!realTeamInfo || !srID || !realTeamInfo[srID]) {
		return false;
	}

	const realInfoRoot = realTeamInfo[srID];

	const realInfoSeasons = realInfoRoot.seasons ?? {};

	// Available seasons that are less than or equal to the input season
	const seasons = Object.keys(realInfoSeasons)
		.map(x => parseInt(x))
		.filter(x => !Number.isNaN(x))
		.filter(x => x <= season);

	if (seasons.length === 0) {
		if (!options.exactSeason) {
			return applyToObject(t, realInfoRoot);
		}

		return false;
	}

	// Sort ascending
	seasons.sort((a, b) => a - b);

	// Only apply this current season, for efficiency
	if (options.exactSeason) {
		if (!seasons.includes(season)) {
			return false;
		}

		return applyToObject(t, realInfoSeasons[seasons.at(-1)!]);
	}

	// Merge prior seasons, in case there is a partial one and applyToObject above applied something from the root (like updating imgURLSmall without updating imgURL, would default to root imgURL otherwise)
	const realInfoMerged = Object.assign(
		{},
		realInfoRoot,
		...seasons.map(season => realInfoSeasons[season]),
	) as IndividualRealTeamInfo;

	return applyToObject(t, realInfoMerged);
};

export default applyRealTeamInfo;
