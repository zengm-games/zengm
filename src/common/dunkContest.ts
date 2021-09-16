import type { View } from "./types";

export const dunkInfos: Record<
	"toss" | "distance" | "move",
	Record<
		string,
		{
			name: string;
			difficulty: number;
			group?: string;
		}
	>
> = {
	toss: {
		none: {
			name: "none",
			difficulty: 0,
		},
		"free-throw": {
			name: "from the free throw line, catch off the backboard",
			difficulty: 1,
		},
		side: {
			name: "off the side of the backboard",
			difficulty: 2,
		},
		"three-point": {
			name: "from the three point line, catch off the bounce",
			difficulty: 3,
		},
		"half-court": {
			name: "from half court, catch off the bounce",
			difficulty: 4,
		},
	},
	distance: {
		"at-rim": {
			name: "right at the rim",
			difficulty: 0,
		},
		"dotted-line": {
			name: "9 feet (dotted line)",
			difficulty: 1,
		},
		"twelve-feet": {
			name: "12 feet",
			difficulty: 2,
		},
		"free-throw": {
			name: "15 feet (free throw line)",
			difficulty: 4,
		},
	},
	move: {
		none: {
			name: "none",
			difficulty: 0,
		},
		windmill: {
			name: "windmill",
			difficulty: 1,
		},
		"double-clutch": {
			name: "double clutch",
			difficulty: 1,
		},
		"behind-back": {
			name: "behind the back",
			difficulty: 2,
		},
		"between-legs": {
			name: "between the legs",
			difficulty: 3,
		},
		"honey-dip": {
			name: "honey dip",
			difficulty: 3,
		},
		"spin-180": {
			name: "180°",
			difficulty: 1,
			group: "spin",
		},
		"spin-360": {
			name: "360°",
			difficulty: 2,
			group: "spin",
		},
		"spin-540": {
			name: "540°",
			difficulty: 4,
			group: "spin",
		},
		"spin-720": {
			name: "720°",
			difficulty: 8,
			group: "spin",
		},
		"over-sitting": {
			name: "jump over sitting person",
			difficulty: 1,
			group: "over",
		},
		"over-short": {
			name: "jump over a short person",
			difficulty: 2,
			group: "over",
		},
		"over-tall": {
			name: "jump over a tall person",
			difficulty: 4,
			group: "over",
		},
	},
};

export const getValidMoves = (otherMove: string) => {
	const move1 = dunkInfos.move[otherMove];

	const validMoves = {
		...dunkInfos.move,
	};
	if (otherMove !== "none") {
		delete validMoves[otherMove];
	}
	if (move1.group !== undefined) {
		for (const move of Object.keys(validMoves)) {
			if (validMoves[move].group === move1.group) {
				delete validMoves[move];
			}
		}
	}
	return validMoves;
};

export const isDunkContest = (
	contest: View<"allStarDunk">["dunk"] | View<"allStarThree">["three"],
): contest is View<"allStarDunk">["dunk"] => {
	return !!(contest as any).controlling;
};

// This assumes half the round advances, rounding down to a power of 2 in the first round if it's not already one
export const getNumRounds = (contest: { players: any[] }) =>
	Math.floor(Math.log2(contest.players.length));
