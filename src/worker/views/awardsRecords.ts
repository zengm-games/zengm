import { idb } from "../db/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts"; // Keep in sync with Dropdown.js
import { bySport } from "../../common/sportFunctions.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { countBy, maxBy } from "../../common/utils.ts";
import { leaderAwardCategories } from "../core/season/awards.ts";

// Sync with useDropdownOptions
const optionsTmp = [
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

optionsTmp.push(
	...leaderAwardCategories.map((x) => {
		return {
			val: x.name,
			key: `${x.stat}_leader`,
		};
	}),
);

const awardOptions: any = {};
optionsTmp.forEach((o) => {
	awardOptions[o.key] = o.val;
});

type LocalPlayerAward = {
	season: number;
	type: string;
};

type LocalPlayer = {
	awards: LocalPlayerAward[];
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

const getPlayerAwards = (p: LocalPlayer, awardType: string) => {
	const aType = awardOptions[awardType];

	let filter;
	if (awardType === "all_league") {
		filter = (a: LocalPlayerAward) => {
			const o = awardOptions;
			return (
				a.type === o.first_team ||
				a.type === o.second_team ||
				a.type === o.third_team
			);
		};
	} else if (awardType === "all_def") {
		filter = (a: LocalPlayerAward) => {
			const o = awardOptions;
			return (
				a.type === o.first_def ||
				a.type === o.second_def ||
				a.type === o.third_def ||
				a.type === "All-Defensive Team"
			);
		};
	} else if (awardType === "all_off") {
		filter = (a: LocalPlayerAward) => {
			return a.type === "All-Offensive Team";
		};
	} else {
		filter = (a: LocalPlayerAward) => a.type === aType;
	}

	const getTeam = (season: number) => {
		const stats = p.stats.filter((s) => s.season === season);

		return stats.at(-1)?.abbrev ?? "???";
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

const updateAwardsRecords = async (
	inputs: ViewInput<"awardsRecords">,
	updateEvents: UpdateEvents,
	state: any,
) => {
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
			playerCount: awardsRecords.length,
			awardTypeVal: awardOptions[awardType],
			awardType,
		};
	}
};

export default updateAwardsRecords;
