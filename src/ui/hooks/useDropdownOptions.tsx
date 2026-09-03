import {
	PHASE,
	TEAM_STATS_TABLES,
	POSITIONS,
	PLAYER_STATS_TABLES,
	REMAINING_PLAYOFF_TEAMS_PHASES,
} from "../../common/constants.ts";
import { useLocal } from "../util/local.ts";
import type { LocalStateUI } from "../../common/types.ts";
import { orderBy } from "../../common/utils.ts";
import { bySport, isSport } from "../../common/sportFunctions.ts";
import { makeResponsiveDropdownOption } from "../../common/makeResponsiveDropdownOption.tsx";
import { leaderAwardCategories } from "../../common/awards.ts";

export type ResponsiveOption = {
	minWidth: number;
	text: string;
};

export type DropdownOption = {
	key: number | string;
	value: string | ResponsiveOption[];
};

export const getSortedTeams = ({
	teamInfoCache,
	hideDisabledTeams,
}: {
	teamInfoCache: LocalStateUI["teamInfoCache"];
	hideDisabledTeams: boolean;
}) => {
	const array = [
		...orderBy(
			teamInfoCache.filter((t) => !t.disabled),
			["region", "name"],
		),
	];

	if (!hideDisabledTeams) {
		array.push(
			...orderBy(
				teamInfoCache.filter((t) => t.disabled),
				["region", "name"],
			),
		);
	}

	const object: Record<string, string | ResponsiveOption[]> = {};
	for (const t of array) {
		const inactiveText = t.disabled ? " (inactive)" : "";
		object[t.abbrev] = makeResponsiveDropdownOption(
			`${t.abbrev}${inactiveText}`,
			`${t.region} ${t.name}${inactiveText}`,
		);
	}

	return object;
};

const dropdownValues: Record<string, string | ResponsiveOption[]> = {
	special: "All-Star Game",
	"all|||teams": makeResponsiveDropdownOption("All", "All Teams"),
	watch: makeResponsiveDropdownOption("Watch", "Watch List"),
	career: "Career",
	regularSeason: makeResponsiveDropdownOption("Reg Seas", "Regular Season"),
	playoffs: "Playoffs",
	"playoffs|||teams": makeResponsiveDropdownOption(
		"Playoffs",
		"Remaining Playoff Teams",
	),
	"10": "Past 10 Seasons",
	"all|||seasons": makeResponsiveDropdownOption("All", "All Seasons"),
	perGame: makeResponsiveDropdownOption("Per G", "Per Game"),
	per36: makeResponsiveDropdownOption("Per 36", "Per 36 Minutes"),
	totals: "Totals",
	shotLocations: "Shot Locations and Feats",
	advanced: "Advanced",
	gameHighs: "Game Highs",
	passing: "Passing",
	rushing: "Rushing",
	rushingReceiving: "Rushing and Receiving",
	defense: "Defense",
	kicking: "Kicking",
	returns: "Returns",
	"all|||types": makeResponsiveDropdownOption("All", "All Types"),
	draft: "Draft",
	freeAgent: "FA Signed",
	reSigned: "Re-signed",
	release: "Released",
	trade: "Trades",
	team: "Team",
	opponent: makeResponsiveDropdownOption("Opp", "Opponent"),
	oppBatting: makeResponsiveDropdownOption("Opp Batting", "Opponent Batting"),
	oppPitching: makeResponsiveDropdownOption(
		"Opp Pitching",
		"Opponent Pitching",
	),
	oppFielding: makeResponsiveDropdownOption(
		"Opp Fielding",
		"Opponent Fielding",
	),
	by_team: "By Team",
	by_conf: makeResponsiveDropdownOption("By Conf", "By Conference"),
	by_div: makeResponsiveDropdownOption("By Div", "By Division"),
	"all|||news": makeResponsiveDropdownOption("All", "All Stories"),
	normal: "Normal",
	big: "Only Big News",
	newest: "Newest First",
	oldest: "Oldest First",
	league: makeResponsiveDropdownOption("Leag", "League"),
	conf: makeResponsiveDropdownOption("Conf", "Conference"),
	div: makeResponsiveDropdownOption("Div", "Division"),
	your_teams: "Your Teams",
	skater: "Skaters",
	goalie: "Goalies",
	combined: "Combined",
	current: "Current",
	overview: "Overview",
	gameLog: "Game Log",
	available: "Available",
	signed: "Signed",
	both: "Both",
	draftPick: "Draft Picks",
	game: "Games",
	player: "Players",
	teamSeason: "Teams",
};

const leaderInfos = leaderAwardCategories.map((x) => {
	return {
		val: x.name,
		key: `${x.stat}_leader`,
	};
});
for (const { key, val } of leaderInfos) {
	dropdownValues[key] = val;
}

if (isSport("baseball")) {
	Object.assign(dropdownValues, {
		batting: PLAYER_STATS_TABLES.batting!.name,
		pitching: PLAYER_STATS_TABLES.pitching!.name,
		fielding: PLAYER_STATS_TABLES.fielding!.name,
	});
}

if (isSport("hockey")) {
	Object.assign(dropdownValues, {
		F: "Forwards",
		D: "Defense",
		G: "Goalies",
	});
}

export const getDropdownValue = (
	key: number | string,
	sortedTeams: Record<string, string | ResponsiveOption[]>,
) => {
	if (typeof key === "number") {
		return String(key);
	}

	if (sortedTeams[key] !== undefined) {
		return sortedTeams[key];
	}

	if (dropdownValues[key] !== undefined) {
		return dropdownValues[key];
	}

	// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (TEAM_STATS_TABLES[key]) {
		return TEAM_STATS_TABLES[key].name;
	}

	if (POSITIONS.includes(key)) {
		return key;
	}

	return "???";
};

const useDropdownOptions = (
	field: string,
	customOptions?: DropdownOption[],
) => {
	const state = useLocal([
		"hideDisabledTeams",
		"phase",
		"season",
		"startingSeason",
		"teamInfoCache",
	]);

	const sortedTeams = getSortedTeams(state);

	let keys: (number | string)[];

	if (customOptions) {
		return customOptions;
	} else if (field === "teams") {
		keys = Object.keys(sortedTeams);
	} else if (field === "teamsAndSpecial") {
		keys = ["special", ...Object.keys(sortedTeams)];
	} else if (field === "teamsAndAll") {
		keys = ["all|||teams", ...Object.keys(sortedTeams)];
	} else if (field === "teamsAndAllWatchPlayoffs") {
		keys = [
			"all|||teams",
			...(REMAINING_PLAYOFF_TEAMS_PHASES.has(state.phase)
				? ["playoffs|||teams"]
				: []),
			"watch",
			...Object.keys(sortedTeams),
		];
	} else if (field === "teamsAndYours") {
		keys = ["your_teams", ...Object.keys(sortedTeams)];
	} else if (
		field === "seasons" ||
		field === "seasonsAndCareer" ||
		field === "seasonsAndAll" ||
		field === "seasonsAndCurrent" ||
		field === "seasonsAndOldDrafts" ||
		field === "seasonsHistory" ||
		field === "seasonsFreeAgents"
	) {
		keys = [];

		for (let season = state.season; season >= state.startingSeason; season--) {
			keys.push(season);
		}

		if (field === "seasonsAndCareer") {
			keys.unshift("career", "all|||seasons");
		}

		if (field === "seasonsAndAll") {
			keys.unshift("all|||seasons");
		}

		if (field === "seasonsAndCurrent") {
			keys.unshift("current");
		}

		if (field === "seasonsAndOldDrafts") {
			const NUM_PAST_SEASONS = 20; // Keep synced with league/create.js

			for (
				let season = state.startingSeason - 1;
				season >= state.startingSeason - NUM_PAST_SEASONS;
				season--
			) {
				keys.push(season);
			}

			// Remove current season, if draft hasn't happened yet
			if (state.phase < PHASE.DRAFT) {
				keys.shift();
			}
		}

		if (field === "seasonsHistory") {
			// Remove current season until playoffs end
			if (state.phase <= PHASE.PLAYOFFS) {
				keys.shift();
			}
		}
	} else if (field === "seasonsUpcoming") {
		keys = []; // For upcomingFreeAgents, bump up 1 if we're past the season

		const offset = state.phase <= PHASE.RESIGN_PLAYERS ? 0 : 1;

		for (let j = 4 + offset; j >= offset; j--) {
			keys.push(state.season + j);
		}
	} else if (field === "playoffs") {
		keys = ["regularSeason", "playoffs"];
	} else if (field === "playoffsCombined") {
		keys = ["regularSeason", "playoffs", "combined"];
	} else if (field === "shows") {
		keys = ["10", "all|||seasons"];
	} else if (field === "statTypes" || field === "statTypesAdv") {
		keys = bySport({
			baseball: [
				"batting",
				"pitching",
				"fielding",
				...(field === "statTypesAdv" ? ["advanced", "gameHighs"] : []),
			],
			basketball: [
				"perGame",
				"per36",
				"totals",
				...(field === "statTypesAdv"
					? ["shotLocations", "advanced", "gameHighs"]
					: []),
			],
			football: [
				"passing",
				"rushingReceiving",
				"blocking",
				"defense",
				"kicking",
				"punting",
				"returns",
			],
			hockey: [
				"skater",
				"goalie",
				...(field === "statTypesAdv" ? ["advanced", "gameHighs"] : []),
			],
		});
	} else if (field === "statTypesStrict") {
		keys = bySport({
			baseball: ["totals"],
			basketball: ["perGame", "per36", "totals"],
			football: ["totals"],
			hockey: ["totals"],
		});
	} else if (field === "eventType") {
		keys = [
			"all|||types",
			"draft",
			"freeAgent",
			"reSigned",
			"release",
			"trade",
		];
	} else if (field === "teamOpponent") {
		keys = ["team", "opponent"];
	} else if (field === "teamOpponentAdvanced") {
		keys = Object.keys(TEAM_STATS_TABLES);
	} else if (field === "teamAdvanced") {
		keys = Object.keys(TEAM_STATS_TABLES).filter(
			(key) => !key.includes("pponent") && !key.includes("opp"),
		);
	} else if (field === "teamRecordType") {
		keys = ["by_team", "by_conf", "by_div"];
	} else if (field === "teamRecordsFilter") {
		keys = ["all|||teams", "your_teams"];
	} else if (field === "depth") {
		keys = bySport({
			baseball: [],
			hockey: ["F", "D", "G"],
			default: POSITIONS,
		});
	} else if (field === "newsLevels") {
		keys = ["big", "normal", "all|||news"];
	} else if (field === "newestOldestFirst") {
		keys = ["newest", "oldest"];
	} else if (field === "standingsType") {
		keys = ["league", "conf", "div"];
	} else if (field === "playerProfile") {
		keys = ["overview", "gameLog"];
	} else if (field === "typeFreeAgents") {
		keys = ["available", "signed", "both"];
	} else if (field === "notesType") {
		keys = ["draftPick", "game", "player", "teamSeason"];
	} else {
		throw new Error(`Unknown Dropdown field: ${field}`);
	}

	const newOptions: DropdownOption[] = keys.map((rawKey) => {
		const key =
			typeof rawKey === "string" && rawKey.includes("|||")
				? rawKey.split("|||")[0]!
				: rawKey;
		return {
			key,
			value: getDropdownValue(rawKey, sortedTeams),
		};
	});

	return newOptions;
};

export default useDropdownOptions;
