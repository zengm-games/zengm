import { TEAM_STATS_TABLES } from "./constants.ts";
import { bySport } from "./sportFunctions.ts";

const playoffs = ["regularSeason", "playoffs"] as const;

const statTypes = bySport<readonly string[]>({
	baseball: ["batting", "pitching", "fielding"],
	basketball: ["perGame", "per36", "totals"],
	football: [
		"passing",
		"rushingReceiving",
		"blocking",
		"defense",
		"kicking",
		"punting",
		"returns",
	],
	hockey: ["skater", "goalie"],
});

const statTypesAdv = bySport<readonly string[]>({
	baseball: [...statTypes, "advanced", "gameHighs"],
	basketball: [...statTypes, "shotLocations", "advanced", "gameHighs"],
	football: statTypes,
	hockey: [...statTypes, "advanced", "gameHighs"],
});

const teamOpponentAdvanced = Object.keys(TEAM_STATS_TABLES);

// Keys of dropdown options that are used in URLs. The UI adds labels to make the dropdown options, and the worker validates URL params against these, so they can't get out of sync.
export const dropdownKeys = {
	playoffs,
	playoffsCombined: [...playoffs, "combined"] as const,
	shows: ["10", "all"] as const,
	statTypes,
	statTypesAdv,

	// Game highs can't be plotted, since each value is a tuple of the stat and the game it happened in
	statTypesDists: statTypesAdv.filter((key) => key !== "gameHighs"),
	statTypesStrict: bySport<readonly ("perGame" | "per36" | "totals")[]>({
		basketball: ["perGame", "per36", "totals"],
		default: ["totals"],
	}),
	teamAdvanced: teamOpponentAdvanced.filter(
		(key) => !key.includes("pponent") && !key.includes("opp"),
	),
	teamOpponentAdvanced,
};
