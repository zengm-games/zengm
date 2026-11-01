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
import { bySport } from "../../common/sportFunctions.ts";
import { makeResponsiveDropdownOption } from "../../common/makeResponsiveDropdownOption.tsx";

export type ResponsiveOption = {
	minWidth: number;
	text: string;
};

export type DropdownLabel = string | ResponsiveOption[];

export type DropdownOption = {
	key: number | string;
	label: DropdownLabel;

	// What goes in the URL when this option is selected, if it's different than key. Team options have the tid as their key and `${abbrev}_${tid}` in the URL.
	urlPart?: string;
};

type TeamsSource = {
	type: "teams";
	allStarGame?: boolean;
	all?: boolean;
	remainingPlayoffTeams?: boolean;
	watch?: boolean;
	yourTeams?: boolean;
};

type SeasonsSource = {
	type: "seasons";
	current?: boolean;
	career?: boolean;
	all?: boolean;

	// Include seasons before startingSeason that have draft classes, and exclude the current season until its draft happens
	pastDrafts?: boolean;

	// Exclude the current season until the playoffs end
	completedOnly?: boolean;
};

type UpcomingSeasonsSource = {
	type: "upcomingSeasons";
};

// Options that depend on the current league state, so they can't be a static list
export type DynamicDropdownSource =
	| TeamsSource
	| SeasonsSource
	| UpcomingSeasonsSource;

export type DropdownOptionsSource = DropdownOption[] | DynamicDropdownSource;

export const dropdownOptionsStateKeys = [
	"hideDisabledTeams",
	"phase",
	"season",
	"startingSeason",
	"teamInfoCache",
] as const;

export type DropdownOptionsState = Pick<
	LocalStateUI,
	(typeof dropdownOptionsStateKeys)[number]
>;

const getTeamOptions = (
	source: TeamsSource,
	state: DropdownOptionsState,
): DropdownOption[] => {
	const options: DropdownOption[] = [];

	if (source.allStarGame) {
		options.push({ key: "special", label: "All-Star Game" });
	}
	if (source.all) {
		options.push({
			key: "all",
			label: makeResponsiveDropdownOption("All", "All Teams"),
		});
	}
	if (
		source.remainingPlayoffTeams &&
		REMAINING_PLAYOFF_TEAMS_PHASES.has(state.phase)
	) {
		options.push({
			key: "playoffs",
			label: makeResponsiveDropdownOption(
				"Playoffs",
				"Remaining Playoff Teams",
			),
		});
	}
	if (source.watch) {
		options.push({
			key: "watch",
			label: makeResponsiveDropdownOption("Watch", "Watch List"),
		});
	}
	if (source.yourTeams) {
		options.push({ key: "your_teams", label: "Your Teams" });
	}

	const teams = state.teamInfoCache.map((t, tid) => ({ ...t, tid }));
	const sortedTeams = [
		...orderBy(
			teams.filter((t) => !t.disabled),
			["region", "name"],
		),
		...(state.hideDisabledTeams
			? []
			: orderBy(
					teams.filter((t) => t.disabled),
					["region", "name"],
				)),
	];

	for (const t of sortedTeams) {
		const inactiveText = t.disabled ? " (inactive)" : "";
		options.push({
			key: t.tid,
			label: makeResponsiveDropdownOption(
				`${t.abbrev}${inactiveText}`,
				`${t.region} ${t.name}${inactiveText}`,
			),
			urlPart: `${t.abbrev}_${t.tid}`,
		});
	}

	return options;
};

// Keep synced with league/create.js
const NUM_PAST_SEASONS = 20;

const getSeasonOptions = (
	source: SeasonsSource,
	state: DropdownOptionsState,
): DropdownOption[] => {
	const seasons: number[] = [];
	for (let season = state.season; season >= state.startingSeason; season--) {
		seasons.push(season);
	}

	if (source.pastDrafts) {
		for (
			let season = state.startingSeason - 1;
			season >= state.startingSeason - NUM_PAST_SEASONS;
			season--
		) {
			seasons.push(season);
		}

		if (state.phase < PHASE.DRAFT) {
			seasons.shift();
		}
	}

	if (source.completedOnly && state.phase <= PHASE.PLAYOFFS) {
		seasons.shift();
	}

	const options: DropdownOption[] = [];

	if (source.current) {
		options.push({ key: "current", label: "Current" });
	}
	if (source.career) {
		options.push({ key: "career", label: "Career" });
	}
	if (source.all) {
		options.push({
			key: "all",
			label: makeResponsiveDropdownOption("All", "All Seasons"),
		});
	}

	for (const season of seasons) {
		options.push({ key: season, label: String(season) });
	}

	return options;
};

const getUpcomingSeasonOptions = (
	state: DropdownOptionsState,
): DropdownOption[] => {
	// For upcomingFreeAgents, bump up 1 if we're past the season
	const offset = state.phase <= PHASE.RESIGN_PLAYERS ? 0 : 1;

	const options: DropdownOption[] = [];
	for (let i = 4 + offset; i >= offset; i--) {
		const season = state.season + i;
		options.push({ key: season, label: String(season) });
	}

	return options;
};

export const getDropdownOptions = (
	source: DropdownOptionsSource,
	state: DropdownOptionsState,
): DropdownOption[] => {
	if (Array.isArray(source)) {
		return source;
	}

	if (source.type === "teams") {
		return getTeamOptions(source, state);
	}

	if (source.type === "seasons") {
		return getSeasonOptions(source, state);
	}

	return getUpcomingSeasonOptions(state);
};

// Compares as strings, like <select> does, so a value read from a <select> matches a numeric key
export const findDropdownOption = (
	options: DropdownOption[],
	value: number | string,
) => {
	return options.find((option) => String(option.key) === String(value));
};

// Value that goes in the URL for the option with key value, or value itself if it's not one of the options (like a disabled team that is hidden from the dropdown, which the worker can still look up by tid)
export const getDropdownUrlPart = (
	options: DropdownOption[],
	value: number | string,
) => {
	const option = findDropdownOption(options, value);
	if (option) {
		return option.urlPart ?? option.key;
	}

	return value;
};

const useDropdownOptions = (source: DynamicDropdownSource) => {
	const state = useLocal([...dropdownOptionsStateKeys]);
	return getDropdownOptions(source, state);
};

export default useDropdownOptions;

const playoffs: DropdownOption[] = [
	{
		key: "regularSeason",
		label: makeResponsiveDropdownOption("Reg Seas", "Regular Season"),
	},
	{ key: "playoffs", label: "Playoffs" },
];

const statTypes: DropdownOption[] = bySport({
	baseball: [
		{ key: "batting", label: PLAYER_STATS_TABLES.batting!.name },
		{ key: "pitching", label: PLAYER_STATS_TABLES.pitching!.name },
		{ key: "fielding", label: PLAYER_STATS_TABLES.fielding!.name },
	],
	basketball: [
		{
			key: "perGame",
			label: makeResponsiveDropdownOption("Per G", "Per Game"),
		},
		{
			key: "per36",
			label: makeResponsiveDropdownOption("Per 36", "Per 36 Minutes"),
		},
		{ key: "totals", label: "Totals" },
	],
	football: [
		{ key: "passing", label: "Passing" },
		{ key: "rushingReceiving", label: "Rushing and Receiving" },
		{ key: "blocking", label: "Blocking" },
		{ key: "defense", label: "Defense" },
		{ key: "kicking", label: "Kicking" },
		{ key: "punting", label: "Punting" },
		{ key: "returns", label: "Returns" },
	],
	hockey: [
		{ key: "skater", label: "Skaters" },
		{ key: "goalie", label: "Goalies" },
	],
});

const advancedAndGameHighs: DropdownOption[] = [
	{ key: "advanced", label: "Advanced" },
	{ key: "gameHighs", label: "Game Highs" },
];

const statTypesAdv: DropdownOption[] = bySport({
	baseball: [...statTypes, ...advancedAndGameHighs],
	basketball: [
		...statTypes,
		{ key: "shotLocations", label: "Shot Locations and Feats" },
		...advancedAndGameHighs,
	],
	football: statTypes,
	hockey: [...statTypes, ...advancedAndGameHighs],
});

const teamStatsLabelOverrides: Record<string, DropdownLabel> = {
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
};

const teamOpponentAdvanced: DropdownOption[] = Object.entries(
	TEAM_STATS_TABLES,
).map(([key, table]) => ({
	key,
	label: teamStatsLabelOverrides[key] ?? table.name,
}));

// Static option lists, for dropdowns whose options don't depend on league state
export const dropdownOptions = {
	depth: bySport<DropdownOption[]>({
		baseball: [],
		hockey: [
			{ key: "F", label: "Forwards" },
			{ key: "D", label: "Defense" },
			{ key: "G", label: "Goalies" },
		],
		default: POSITIONS.map((pos: string) => ({ key: pos, label: pos })),
	}),
	eventType: [
		{ key: "all", label: makeResponsiveDropdownOption("All", "All Types") },
		{ key: "draft", label: "Draft" },
		{ key: "freeAgent", label: "FA Signed" },
		{ key: "reSigned", label: "Re-signed" },
		{ key: "release", label: "Released" },
		{ key: "trade", label: "Trades" },
	],
	newestOldestFirst: [
		{ key: "newest", label: "Newest First" },
		{ key: "oldest", label: "Oldest First" },
	],
	newsLevels: [
		{ key: "big", label: "Only Big News" },
		{ key: "normal", label: "Normal" },
		{ key: "all", label: makeResponsiveDropdownOption("All", "All Stories") },
	],
	notesType: [
		{ key: "draftPick", label: "Draft Picks" },
		{ key: "game", label: "Games" },
		{ key: "player", label: "Players" },
		{ key: "teamSeason", label: "Teams" },
	],
	playerProfile: [
		{ key: "overview", label: "Overview" },
		{ key: "gameLog", label: "Game Log" },
	],
	playoffs,
	playoffsCombined: [...playoffs, { key: "combined", label: "Combined" }],
	shows: [
		{ key: "10", label: "Past 10 Seasons" },
		{ key: "all", label: makeResponsiveDropdownOption("All", "All Seasons") },
	],
	standingsType: [
		{ key: "league", label: makeResponsiveDropdownOption("Leag", "League") },
		{ key: "conf", label: makeResponsiveDropdownOption("Conf", "Conference") },
		{ key: "div", label: makeResponsiveDropdownOption("Div", "Division") },
	],
	statTypes,
	statTypesAdv,
	statTypesStrict: bySport<DropdownOption[]>({
		basketball: statTypes,
		default: [{ key: "totals", label: "Totals" }],
	}),
	teamAdvanced: teamOpponentAdvanced.filter(
		(option) =>
			typeof option.key === "string" &&
			!option.key.includes("pponent") &&
			!option.key.includes("opp"),
	),
	teamOpponentAdvanced,
	teamRecordsFilter: [
		{ key: "all", label: makeResponsiveDropdownOption("All", "All Teams") },
		{ key: "your_teams", label: "Your Teams" },
	],
	teamRecordType: [
		{ key: "by_team", label: "By Team" },
		{
			key: "by_conf",
			label: makeResponsiveDropdownOption("By Conf", "By Conference"),
		},
		{
			key: "by_div",
			label: makeResponsiveDropdownOption("By Div", "By Division"),
		},
	],
	typeFreeAgents: [
		{ key: "available", label: "Available" },
		{ key: "signed", label: "Signed" },
		{ key: "both", label: "Both" },
	],
} satisfies Record<string, DropdownOption[]>;
