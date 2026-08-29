import {
	formatPlayerAwardName,
	leaderAwardCategories,
} from "../../common/awards.ts";
import type { PlayerAwardSimple } from "../../common/types.ts";
import { orderBy } from "../../common/utils.ts";
import type { PlayerAwardBuiltInWithPrefix } from "../../worker/views/player.ts";
import { helpers } from "./helpers.ts";

// These are "awards" not stored in awards table to show before/after normal awards
const awardsStart = ["Inducted into the Hall of Fame", "Won Championship"];
const awardsEnd = [
	"All-Star MVP",
	"All-Star",
	"Slam Dunk Contest Winner",
	"Three-Point Contest Winner",
	...leaderAwardCategories.map((x) => x.name),
];

const formatNameLong = (
	award: Omit<PlayerAwardSimple, "season"> | PlayerAwardBuiltInWithPrefix,
	hideTeamName: boolean,
) => {
	return formatPlayerAwardName(award, {
		groupPrefix: award.type === undefined ? award.groupPrefix : undefined,
		hideTeamName,
	});
};

const getName = (
	award: Omit<PlayerAwardSimple, "season"> | PlayerAwardBuiltInWithPrefix,
	short: boolean | undefined,
) => {
	if (!short) {
		return formatNameLong(award, false);
	}

	if (award.type === undefined) {
		return award.name.length <= 15 ? award.name : award.shortName;
	}

	let type = award.type;

	if (type === "Inducted into the Hall of Fame") {
		type = "Hall of Fame";
	} else if (type === "Most Valuable Player") {
		type = "MVP";
	} else if (type === "Won Championship") {
		type = "Champion";
	} else if (type === "Finals MVP") {
		type = "FMVP";
	} else if (type === "Playoffs MVP") {
		type = "PMVP";
	} else if (type === "Semifinals MVP") {
		type = "SFMVP";
	} else if (type === "Offensive Player of the Year") {
		type = "OPOY";
	} else if (type === "Protector of the Year") {
		type = "POY";
	} else if (type === "Defensive Player of the Year") {
		type = "DPOY";
	} else if (type === "Defensive Forward of the Year") {
		type = "DFOY";
	} else if (type === "Goalie of the Year") {
		type = "GOY";
	} else if (type === "Sixth Man of the Year") {
		type = "SMOY";
	} else if (type === "Most Improved Player") {
		type = "MIP";
	} else if (type === "Rookie of the Year") {
		type = "ROY";
	} else if (type === "Offensive Rookie of the Year") {
		type = "OROY";
	} else if (type === "Defensive Rookie of the Year") {
		type = "DROY";
	} else if (type === "Slam Dunk Contest Winner") {
		type = "Slam Dunk Contest";
	} else if (type === "Three-Point Contest Winner") {
		type = "Three-Point Contest";
	} else if (type.includes("All-League")) {
		type = "All-League";
	} else if (type.includes("All-Offensive")) {
		type = "All-Offensive";
	} else if (type.includes("All-Defensive")) {
		type = "All-Defensive";
	} else if (type.includes("All-Rookie")) {
		type = "All-Rookie";
	} else if (type.endsWith("Leader")) {
		type = type.replace("League ", "");
	}

	return type;
};

// Don't return First Team All-League when the group represents all All-League awards
const getLongWithoutTeamNumber = (type: string, originalType: string) => {
	if (type.startsWith("All-")) {
		return type;
	}

	return originalType;
};

export const groupAwards = (
	awards: (PlayerAwardSimple | PlayerAwardBuiltInWithPrefix)[],
	shortNames?: boolean,
) => {
	const seen = new Set();
	const awardsGrouped = [];
	const awardsGroupedTemp = Object.groupBy(
		awards.filter((award) => {
			if (
				award.type === undefined &&
				award.numTeams === undefined &&
				award.rank > 1
			) {
				// Non-1st finish for individual award
				return false;
			}
			return true;
		}),
		(award) => getName(award, shortNames),
	);

	const processFakeAwards = (names: string[]) => {
		for (const originalType of names) {
			const type = getName({ type: originalType }, shortNames);
			const long = getLongWithoutTeamNumber(type, originalType);

			if (awardsGroupedTemp[type] && !seen.has(type)) {
				awardsGrouped.push({
					type,
					long,
					count: awardsGroupedTemp[type].length,
					seasons: {
						[long]: helpers.yearRanges(
							awardsGroupedTemp[type].map((a) => a.season),
						),
					},
				});
				seen.add(type);
			}
		}
	};

	processFakeAwards(awardsStart);

	// Any entry with a "real" award handle here
	const realAwardsGrouped = [];
	for (const [type, awardsTemp] of Object.entries(awardsGroupedTemp)) {
		const awards = awardsTemp!;
		const awardsReal = awards.filter((award) => award.type === undefined);
		if (!seen.has(type) && awardsReal[0]) {
			const averageIndex =
				helpers.sum(awardsReal.map((award) => award.index)) / awardsReal.length;

			const seasonsRaw: Record<string, number[]> = {};
			for (const award of awardsReal) {
				// type is already formatNameLong output if !shortNames
				const name = formatNameLong(award, true);

				seasonsRaw[name] ??= [];
				seasonsRaw[name].push(award.season);
			}
			const seasons: Record<string, string[]> = {};
			for (const [name, awardSeasons] of Object.entries(seasonsRaw)) {
				seasons[name] = helpers.yearRanges(awardSeasons);
			}

			realAwardsGrouped.push({
				type,
				long: awardsReal[0].name,
				count: awardsReal.length,
				seasons,
				averageIndex,
			});
			seen.add(type);
		}
	}

	// Sort real awards based on average index
	awardsGrouped.push(
		...orderBy(realAwardsGrouped, ["averageIndex", "type"], ["asc", "asc"]),
	);

	processFakeAwards(awardsEnd);

	// Handle non-default awards, just for fun if someone wants to add more
	for (const [type, awardsTemp] of Object.entries(awardsGroupedTemp)) {
		const awards = awardsTemp!;
		if (!seen.has(type)) {
			awardsGrouped.push({
				type,
				long: type,
				count: awards.length,
				seasons: {
					[type]: helpers.yearRanges(awards.map((a) => a.season)),
				},
			});
			seen.add(type);
		}
	}

	return awardsGrouped;
};
