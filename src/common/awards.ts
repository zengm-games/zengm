import { helpers } from "./helpers.ts";
import { bySport } from "./sportFunctions.ts";
import type {
	Award,
	AwardInfoIndividual,
	AwardInfoTeam,
	PlayerAwardBuiltIn,
} from "./types.ts";

export const formatTeamNumber = (rank: number) =>
	`${helpers.ordinal(rank)} Team`;

export const formatPlayerAwardName = (
	// This is like PlayerAward but with only the required field specified so it can be used elsewhere easily
	award:
		| {
				type: string;
		  }
		| Pick<PlayerAwardBuiltIn, "name" | "numTeams" | "rank" | "type">,
	{
		groupPrefix,
		hideTeamName,
	}: {
		groupPrefix?: string; // Like for conf awards, prefix with conf abbrev
		hideTeamName?: boolean;
	} = {},
) => {
	if (award.type === undefined) {
		const prefixWithSpace = groupPrefix !== undefined ? `${groupPrefix} ` : "";
		if (award.numTeams === undefined) {
			return `${prefixWithSpace}${award.name}`;
		}

		if (award.numTeams === 1) {
			if (hideTeamName && groupPrefix !== undefined) {
				return groupPrefix;
			}
			return `${prefixWithSpace}${award.name} Team`;
		}

		const prefixAndRank = `${prefixWithSpace}${formatTeamNumber(award.rank)}`;
		if (hideTeamName) {
			return prefixAndRank;
		}

		return `${prefixAndRank} ${award.name}`;
	}

	// For either manually added team awards, or old ones in a league without corresponding awards objects (such as a real players league without all historical data)
	if (award.type.startsWith("First ")) {
		return `1st ${award.type.replace("First ", "")}`;
	}
	if (award.type.startsWith("Second ")) {
		return `2nd ${award.type.replace("Second ", "")}`;
	}
	if (award.type.startsWith("Third ")) {
		return `3rd ${award.type.replace("Third ", "")}`;
	}

	return award.type;
};

export const showStatsByType: Partial<Record<Award["showStats"], string[]>> =
	bySport({
		baseball: {
			// keyStats formats W-L and slash line nicely
			overall: ["keyStats"],
			sp: ["keyStats"],
			rp: ["sv", "era", "ip"],
			offense: ["keyStats"],
			defense: ["keyStats"], // Showing actualy defensive stats would be annoying because arrays
		},
		basketball: {
			offense: ["pts", "trb", "ast"],
			defense: ["trb", "blk", "stl"],
		},
		football: {
			overall: ["keyStats"],
			defense: ["keyStats"],
			blocking: ["keyStats"],
		},
		hockey: {
			overall: ["keyStats", "ps"],
			defense: ["tk", "hit", "dps"],
			goalkeeping: ["gpGoalie", "gaa", "svPct", "gps"],
		},
	});

export const leaderAwardCategories = bySport({
	baseball: [
		{
			name: "League HR Leader",
			stat: "hr",
		},
		{
			name: "League BA Leader",
			stat: "ba",
		},
		{
			name: "League OPS Leader",
			stat: "ops",
		},
		{
			name: "League RBI Leader",
			stat: "rbi",
		},
		{
			name: "League Runs Leader",
			stat: "r",
		},
		{
			name: "League Stolen Bases Leader",
			stat: "sb",
		},
		{
			name: "League Walks Leader",
			stat: "bb",
		},
		{
			name: "League Wins Leader",
			stat: "w",
		},
		{
			name: "League Strikeouts Leader",
			stat: "soPit",
		},
		{
			name: "League ERA Leader",
			stat: "era",
		},
		{
			name: "League Saves Leader",
			stat: "sv",
		},
		{
			name: "League WAR Leader",
			stat: "war",
		},
	],
	basketball: [
		{
			name: "League Scoring Leader",
			stat: "pts",
		},
		{
			name: "League Rebounding Leader",
			stat: "trb",
		},
		{
			name: "League Assists Leader",
			stat: "ast",
		},
		{
			name: "League Steals Leader",
			stat: "stl",
		},
		{
			name: "League Blocks Leader",
			stat: "blk",
		},
	],
	football: [
		{
			name: "League Passing Leader",
			stat: "pssYds",
		},
		{
			name: "League Rushing Leader",
			stat: "rusYds",
		},
		{
			name: "League Receiving Leader",
			stat: "recYds",
		},
		{
			name: "League Scrimmage Yards Leader",
			stat: "ydsFromScrimmage",
		},
		{
			name: "League Interceptions Leader",
			stat: "defInt",
		},
		{
			name: "League Sacks Leader",
			stat: "defSk",
		},
		{
			name: "League TD Leader",
			stat: "totTD",
		},
	],
	hockey: [
		{
			name: "League Points Leader",
			stat: "pts",
		},
		{
			name: "League Goals Leader",
			stat: "g",
		},
		{
			name: "League Assists Leader",
			stat: "a",
		},
	],
});

export const pruneEmptyWinners = (
	awards: (AwardInfoIndividual | AwardInfoTeam)[],
) => {
	return awards.map((award) => {
		if (award.numTeams === undefined) {
			const winner = [...award.winner];

			while (winner.length > 0 && winner.at(-1)?.pid === undefined) {
				winner.pop();
			}

			return {
				...award,
				winner,
			};
		} else {
			const winner = award.winner.map((teamTemp) => {
				const team = [...teamTemp];
				while (team.length > 0 && team.at(-1)?.pid === undefined) {
					team.pop();
				}
				return team;
			});

			return {
				...award,
				winner,
			};
		}
	});
};
