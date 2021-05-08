import { helpers } from "../../../worker/util";
import { sortFunction } from "./rosterAutoSort.hockey";
import type { Position } from "../../../common/types.hockey";
import ovrByPosFactory from "./ovrByPosFactory";
import {
	NUM_LINES,
	NUM_PLAYERS_PER_LINE,
} from "../../../common/constants.hockey";

export const getPlayersInLines = <
	T extends {
		ratings: {
			ovrs: Record<string, number>;
			pos: string;
		};
	}
>(
	players: T[],
) => {
	const info = {
		C: {
			selected: [] as T[],
			minLength: NUM_LINES.F * 1,
			sorted: [...players].sort(sortFunction("C")),
		},
		W: {
			selected: [] as T[],
			minLength: NUM_LINES.F * 2,
			sorted: [...players].sort(sortFunction("W")),
		},
		D: {
			selected: [] as T[],
			minLength: NUM_LINES.D * NUM_PLAYERS_PER_LINE.D,
			sorted: [...players].sort(sortFunction("D")),
		},
		G: {
			selected: [] as T[],
			minLength: NUM_LINES.G * NUM_PLAYERS_PER_LINE.G,
			sorted: [...players].sort(sortFunction("G")),
		},
	};

	const maxLength = Math.max(...Object.values(info).map(x => x.minLength));

	// Set starters (in lines)
	const playersUsed = new Set<typeof players[number]>();
	for (let i = 0; i < maxLength; i++) {
		for (const pos of ["G", "C", "D", "W"] as const) {
			const { selected, minLength, sorted } = info[pos];
			if (selected.length >= minLength) {
				continue;
			}

			for (const p of sorted) {
				if (!playersUsed.has(p)) {
					selected.push(p);
					playersUsed.add(p);
					break;
				}
			}
		}
	}

	return info;
};

// See analysis/team-ovr-football

const intercept = -6.7144658736958;

// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
const weights: Record<Position, number[]> = {
	C: [0.005202835, 0.00877654, 0.009185773, 0.004233644],
	W: [
		0.005874235,
		0.003400263,
		0.007665829,
		0.005394165,
		0.005760525,
		0.003762088,
		0.000313671,
		0.001586573,
	],
	D: [
		0.005936901,
		0.006073251,
		0.004355857,
		0.003416357,
		0.004270886,
		0.0009828,
	],
	G: [0.032293141],
};

const scale = (predictedMOV: number) => {
	// Translate from -0.9/0.9 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 1.8 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

const ovr = ovrByPosFactory(weights, intercept, scale);

export default ovr;
