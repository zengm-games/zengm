import { idb } from "../db";
import type { UpdateEvents, ViewInput } from "../../common/types"; // Keep in sync with Dropdown.js
import { bySport } from "../../common";
import addFirstNameShort from "../util/addFirstNameShort";

// Sync with useDropdownOptions
const optionsTmp = bySport({
	baseball: [
		{
			val: "Won Championship",
			key: "champion",
		},
		{
			val: "Most Valuable Player",
			key: "mvp",
		},
		{
			val: "Finals MVP",
			key: "finals_mvp",
		},
		{
			val: "Pitcher of the Year",
			key: "poy",
		},
		{
			val: "Relief Pitcher of the Year",
			key: "rpoy",
		},
		{
			val: "Rookie of the Year",
			key: "roy",
		},
		{
			val: "All-Offensive",
			key: "all_off",
		},
		{
			val: "All-Defensive",
			key: "all_def",
		},
		{
			val: "All-Star",
			key: "all_star",
		},
		{
			val: "All-Star MVP",
			key: "all_star_mvp",
		},
		{
			val: "League HR Leader",
			key: "hr_leader",
		},
		{
			val: "League RBI Leader",
			key: "rbi_leader",
		},
		{
			val: "League Runs Leader",
			key: "r_leader",
		},
		{
			val: "League Stolen Bases Leader",
			key: "sb_leader",
		},
		{
			val: "League Walks Leader",
			key: "bb_leader",
		},
		{
			val: "League Wins Leader",
			key: "w_leader",
		},
		{
			val: "League Strikeouts Leader",
			key: "soPit_leader",
		},
		{
			val: "League WAR Leader",
			key: "war_leader",
		},
	],
	basketball: [
		{
			val: "Won Championship",
			key: "champion",
		},
		{
			val: "Most Valuable Player",
			key: "mvp",
		},
		{
			val: "Finals MVP",
			key: "finals_mvp",
		},
		{
			val: "Semifinals MVP",
			key: "sfmvp",
		},
		{
			val: "Defensive Player of the Year",
			key: "dpoy",
		},
		{
			val: "Sixth Man of the Year",
			key: "smoy",
		},
		{
			val: "Most Improved Player",
			key: "mip",
		},
		{
			val: "Rookie of the Year",
			key: "roy",
		},
		{
			val: "First Team All-League",
			key: "first_team",
		},
		{
			val: "Second Team All-League",
			key: "second_team",
		},
		{
			val: "Third Team All-League",
			key: "third_team",
		},
		{
			val: "All-League",
			key: "all_league",
		},
		{
			val: "First Team All-Defensive",
			key: "first_def",
		},
		{
			val: "Second Team All-Defensive",
			key: "second_def",
		},
		{
			val: "Third Team All-Defensive",
			key: "third_def",
		},
		{
			val: "All-Defensive",
			key: "all_def",
		},
		{
			val: "All-Star",
			key: "all_star",
		},
		{
			val: "All-Star MVP",
			key: "all_star_mvp",
		},
		{
			val: "Slam Dunk Contest Winner",
			key: "dunk",
		},
		{
			val: "Three-Point Contest Winner",
			key: "three",
		},
		{
			val: "League Scoring Leader",
			key: "ppg_leader",
		},
		{
			val: "League Rebounding Leader",
			key: "rpg_leader",
		},
		{
			val: "League Assists Leader",
			key: "apg_leader",
		},
		{
			val: "League Steals Leader",
			key: "spg_leader",
		},
		{
			val: "League Blocks Leader",
			key: "bpg_leader",
		},
	],
	football: [
		{
			val: "Won Championship",
			key: "champion",
		},
		{
			val: "Most Valuable Player",
			key: "mvp",
		},
		{
			val: "Finals MVP",
			key: "finals_mvp",
		},
		{
			val: "Defensive Player of the Year",
			key: "dpoy",
		},
		{
			val: "Offensive Rookie of the Year",
			key: "oroy",
		},
		{
			val: "Defensive Rookie of the Year",
			key: "droy",
		},
		{
			val: "First Team All-League",
			key: "first_team",
		},
		{
			val: "Second Team All-League",
			key: "second_team",
		},
		{
			val: "All-League",
			key: "all_league",
		},
		{
			val: "All-Star",
			key: "all_star",
		},
		{
			val: "All-Star MVP",
			key: "all_star_mvp",
		},
		{
			val: "League Passing Leader",
			key: "pss_leader",
		},
		{
			val: "League Rushing Leader",
			key: "rush_leader",
		},
		{
			val: "League Receiving Leader",
			key: "rcv_leader",
		},
		{
			val: "League Scrimmage Yards Leader",
			key: "scr_leader",
		},
	],
	hockey: [
		{
			val: "Won Championship",
			key: "champion",
		},
		{
			val: "Most Valuable Player",
			key: "mvp",
		},
		{
			val: "Playoffs MVP",
			key: "finals_mvp",
		},
		{
			val: "Defensive Player of the Year",
			key: "dpoy",
		},
		{
			val: "Defensive Forward of the Year",
			key: "dfoy",
		},
		{
			val: "Goalie of the Year",
			key: "goy",
		},
		{
			val: "Rookie of the Year",
			key: "roy",
		},
		{
			val: "First Team All-League",
			key: "first_team",
		},
		{
			val: "Second Team All-League",
			key: "second_team",
		},
		{
			val: "All-League",
			key: "all_league",
		},
		{
			val: "All-Star",
			key: "all_star",
		},
		{
			val: "All-Star MVP",
			key: "all_star_mvp",
		},
		{
			val: "League Points Leader",
			key: "pts_leader",
		},
		{
			val: "League Goals Leader",
			key: "g_leader",
		},
		{
			val: "League Assists Leader",
			key: "ast_leader",
		},
	],
});

const awardOptions: any = {};
optionsTmp.forEach(o => {
	awardOptions[o.key] = o.val;
});

type LocalPlayerAward = {
	season: number;
	type: string;
};

type LocalPlayer = {
	awards: LocalPlayerAward[];
	firstName: string;
	hof: boolean;
	lastName: string;
	pid: number;
	retiredYear: number;
	stats: {
		abbrev: string;
		season: number;
	}[];
};

function getPlayerAwards(p: LocalPlayer, awardType: string) {
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
		const stats = p.stats.filter(s => s.season === season);

		return stats.at(-1)?.abbrev ?? "???";
	};

	const awards = p.awards.filter(filter);
	const years = awards.map(a => {
		return {
			team: getTeam(a.season),
			season: a.season,
		};
	});
	const lastYear = Math.max(...years.map(y => y.season)).toString();
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
	};
}

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
				filter: p => p.awards.length > 0,
			},
			"noCopyCache",
		);
		const players: LocalPlayer[] = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["awards", "firstName", "lastName", "pid", "retiredYear", "hof"],
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
			players.map(p => getPlayerAwards(p, awardType)).filter(o => o.count > 0),
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
