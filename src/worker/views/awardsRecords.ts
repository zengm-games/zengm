import { idb } from "../db/index.ts";
import type {
	PlayerAward,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts"; // Keep in sync with Dropdown.js
import { bySport } from "../../common/sportFunctions.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { countBy, maxBy } from "../../common/utils.ts";
import { leaderAwardCategories } from "../core/season/awards.ts";

// Sync with useDropdownOptions
const nonCustomAwardsList = [
	{
		val: "All-Star",
		key: "all_star",
	},
	{
		val: "All-Star MVP",
		key: "all_star_mvp",
	},
	{
		val: "Won Championship",
		key: "champion",
	},
	...bySport({
		baseball: [],
		basketball: [
			{
				val: "Slam Dunk Contest Winner",
				key: "dunk",
			},
			{
				val: "Three-Point Contest Winner",
				key: "three",
			},
		],
		football: [],
		hockey: [],
	}),
];

nonCustomAwardsList.push(
	...leaderAwardCategories.map((x) => {
		return {
			val: x.name,
			key: `${x.stat}_leader`,
		};
	}),
);

const nonCustomAwards: Record<string, string> = {};
for (const row of nonCustomAwardsList) {
	nonCustomAwards[row.key] = row.val;
}

type LocalPlayer = {
	awards: PlayerAward[];
	draft: { round: number; pick: number; year: number };
	firstName: string;
	hof: boolean;
	lastName: string;
	pid: number;
	retiredYear: number;
	ratings: {
		pos: string;
		season: number;
	}[];
	stats: {
		abbrev: string;
		season: number;
	}[];
};

const getPlayerAwards = (p: LocalPlayer, key: string) => {
	let filter: ((award: PlayerAward) => boolean) | undefined;
	if (nonCustomAwards[key] !== undefined) {
		filter = (award) => award.type === nonCustomAwards[key];
	} else {
		// Must be a real custom award

		// Look for a team number
		const parts = key.split("~");
		if (parts.length > 0) {
			const suffix = Number.parseInt(parts.at(-1)!);
			if (!Number.isNaN(suffix)) {
				const targetShortName = parts.slice(0, -1).join("");
				const targetRank = suffix;

				// Return all players on the Nth team only
				filter = (award) =>
					award.type === undefined &&
					award.shortName === targetShortName &&
					award.numTeams !== undefined &&
					award.rank === targetRank;
			}
		}

		if (!filter) {
			// Return all players on all teams if numTeams, otherwise return only award winner
			filter = (award) =>
				award.type === undefined &&
				award.shortName === key &&
				(award.numTeams !== undefined ||
					(award.numTeams === undefined && award.rank === 1));
		}
	}

	const getTeam = (season: number) => {
		return p.stats.findLast((row) => row.season === season)?.abbrev ?? "???";
	};

	const awards = p.awards.filter(filter);

	if (awards.length === 0) {
		return;
	}

	const years = awards.map((a) => {
		return {
			team: getTeam(a.season),
			season: a.season,
		};
	});
	const lastYear = Math.max(...years.map((y) => y.season));

	// Find most common pos that this player had for this type of award
	let maxPos;
	const yearsSet = new Set(years.map((row) => row.season));
	const allPos = p.ratings.filter((row) => yearsSet.has(row.season));
	if (allPos.length > 0) {
		const posCounts = Object.entries(countBy(allPos, "pos"));
		maxPos = maxBy(posCounts, 1)![0]!;
	}

	return {
		firstName: p.firstName,
		lastName: p.lastName,
		pid: p.pid,
		count: awards.length,
		countText: awards.length.toString(),
		years,
		lastYear,
		retired: p.retiredYear !== Infinity,
		hof: p.hof,
		pos: maxPos,
		draft: p.draft,
	};
};

type AwardType = {
	maxNumTeams?: number;
	name: string;
	shortName: string;
};

const updateAwardsRecords = async (
	inputs: ViewInput<"awardsRecords">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	let awardTypes: AwardType[];
	if (!state.awardTypes) {
		console.log("COMPUTE AWARD TYPES");
		const awards = await idb.getCopies.awards(undefined, "noCopyCache");
		awards.reverse();
		awardTypes = [];

		// Number contains the number of teams
		const seenAwardTypes = new Map<string, AwardType>();

		for (const row of awards) {
			for (const award of row.awards) {
				const info = seenAwardTypes.get(award.shortName);
				if (!info) {
					const newInfo: AwardType = {
						name: award.name,
						shortName: award.shortName,
					};
					if (award.numTeams !== undefined) {
						newInfo.maxNumTeams = award.numTeams;
					}
					seenAwardTypes.set(award.shortName, newInfo);
					awardTypes.push(newInfo);
				} else if (
					award.numTeams !== undefined &&
					(info.maxNumTeams === undefined || award.numTeams > info.maxNumTeams)
				) {
					info.maxNumTeams = award.numTeams;
				}
			}
		}

		console.log(awardTypes);
	} else {
		awardTypes = state.awardTypes;
	}

	if (
		updateEvents.includes("firstRun") ||
		inputs.awardType !== state.awardType
	) {
		const playersAll = await idb.getCopies.players(
			{
				activeAndRetired: true,
				filter: (p) => p.awards.length > 0,
			},
			"noCopyCache",
		);
		const players: LocalPlayer[] = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"awards",
				"firstName",
				"lastName",
				"pid",
				"retiredYear",
				"hof",
				"draft",
			],
			ratings: ["pos", "season"],
			stats: ["abbrev", "season"],
		});
		const awardType = inputs.awardType;

		if (typeof awardType !== "string") {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "Invalid input for awardType.",
			};
			return returnValue;
		}

		const awardsRecords = addFirstNameShort(
			players
				.map((p) => getPlayerAwards(p, awardType))
				.filter((p) => p !== undefined),
		);

		return {
			awardsRecords,
			awardTypes,
			playerCount: awardsRecords.length,
			awardTypeVal: nonCustomAwards[awardType],
			awardType,
		};
	}
};

export default updateAwardsRecords;
