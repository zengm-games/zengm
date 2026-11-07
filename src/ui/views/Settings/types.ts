import type { Settings } from "../../../worker/views/settings.ts";

// godMode and godModeInPast have their own controls, confs and numActiveTeams are only used to validate other settings
export type Key = Exclude<
	keyof Settings,
	"godMode" | "godModeInPast" | "confs" | "numActiveTeams"
>;

export type Category =
	| "New League"
	| "General"
	| "Schedule"
	| "Standings"
	| "Playoffs"
	| "Teams"
	| "Draft"
	| "Finances"
	| "All-Star"
	| "Inflation"
	| "Contracts"
	| "Rookie Contracts"
	| "Events"
	| "Team Movement"
	| "Injuries"
	| "Game Simulation"
	| "Tendencies"
	| "Elam Ending"
	| "Challenge Modes"
	| "Game Modes"
	| "Players"
	| "Real Players"
	| "UI";

export type FieldType =
	| "bool"
	| "float"
	| "float1000"
	| "floatOrNull"
	| "int"
	| "intOrNull"
	| "jsonString"
	| "string"
	| "rangePercent"
	| "floatValuesOrCustom"
	| "custom";

export type Decoration = "currency" | "percent";

export type Values = {
	key: string;
	value: string;
}[];
