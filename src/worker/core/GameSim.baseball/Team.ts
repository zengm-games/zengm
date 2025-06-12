import {
	NUM_ACTIVE_BATTERS,
	NUM_ACTIVE_PITCHERS,
	NUM_STARTING_PITCHERS,
} from "../../../common/constants.baseball.ts";
import type { Position } from "../../../common/types.baseball.ts";
import { orderBy } from "../../../common/utils.ts";
import { random } from "../../util/index.ts";
import { lineupSort } from "../team/genDepth.baseball.ts";
import { fatigueFactor } from "./fatigueFactor.ts";
import { CLOSER_INDEX, getStartingPitcher } from "./getStartingPitcher.ts";
import type { PlayerGameSim, TeamGameSim } from "./types.ts";

type GamePositions<DH extends boolean> =
	| Exclude<Position, "SP" | "RP" | "DH">
	| "P"
	| (DH extends true ? "DH" : never);

type PlayerInGame<DH extends boolean> = {
	p: PlayerGameSim;
	battingOrder: number;
	pos: GamePositions<DH>;
};

const NUM_BATTERS_PER_SIDE = 9;

type Depth = Record<"pitchers" | "batters", PlayerGameSim[]>;

class Team<DH extends boolean> {
	t: TeamGameSim;
	dh: DH;
	allStarGame: boolean;
	playoffs: boolean;
	playersByPid: Record<number, PlayerGameSim>;
	playersInGame: Record<number, PlayerInGame<DH>>;
	playersInGameByPos: Record<GamePositions<DH>, PlayerInGame<DH>>;
	playersInGameByBattingOrder: [
		PlayerInGame<DH>,
		PlayerInGame<DH>,
		PlayerInGame<DH>,
		PlayerInGame<DH>,
		PlayerInGame<DH>,
		PlayerInGame<DH>,
		PlayerInGame<DH>,
		PlayerInGame<DH>,
		PlayerInGame<DH>,
	];

	atBat: number;
	subIndex: number;
	saveSituation: "saveOnly" | "saveOrHold" | undefined;

	// Depth chart, but adjusted to remove injured players and capped at the number of active players
	depth: Depth;

	constructor(t: TeamGameSim, dh: DH, allStarGame: boolean, playoffs: boolean) {
		this.t = t;
		this.dh = dh;
		this.allStarGame = allStarGame;
		this.playoffs = playoffs;

		this.playersInGame = {};

		this.depth = this.initDepth();

		this.atBat = -1;
		this.subIndex = -1;

		this.playersByPid = {} as any;
		for (const p of this.t.player) {
			this.playersByPid[p.id] = p;
		}

		this.playersInGameByPos = {} as any;
		this.playersInGameByBattingOrder = [] as any;
		this.rebuildIndexes();
	}

	initDepth() {
		// For pitchers, slots have meaning (starter, closer, etc) so maybe it's best to just leave the injured players there and just add extra players
		let numPitchersCurrent = 0;
		const pitchers = [];
		for (const p of this.t.depth.P) {
			pitchers.push(p);
			if (!p.injured) {
				numPitchersCurrent += 1;

				if (NUM_ACTIVE_PITCHERS === numPitchersCurrent) {
					break;
				}
			}
		}

		// Starting pitcher
		const startingPitcher = getStartingPitcher(pitchers, this.allStarGame);

		// This handles replacements for injured players
		this.playersInGame = this.getStartingPlayersInGame(startingPitcher);

		// For starting lineup, sub in top bench players
		const inputBatters = this.dh ? this.t.depth.D : this.t.depth.DP;
		// Start with starting lineup (already guaranteed healthy from getStartingPlayersInGame)
		const batters = inputBatters.filter((p) => this.playersInGame[p.id]);
		// Add healthy bench players
		let numBattersCurrent = batters.length;
		for (const p of inputBatters) {
			if (this.playersInGame[p.id]) {
				// Already a starter
				continue;
			}

			if (!p.injured) {
				batters.push(p);
				numBattersCurrent += 1;

				if (NUM_ACTIVE_BATTERS === numBattersCurrent) {
					break;
				}
			}
		}

		return {
			pitchers,
			batters,
		};
	}

	// This uses this.t.depth rather than this.depth because we want to search the entire roster for injury replacements
	getStartingPlayersInGame(startingPitcher: PlayerGameSim) {
		const playersInGame: Team<DH>["playersInGame"] = {};

		const lineup = this.dh ? this.t.depth.L : this.t.depth.LP;
		const defense = this.dh ? this.t.depth.D : this.t.depth.DP;

		// -1 if not found
		const pitcherBattingOrder = lineup.findIndex((p) => p.id === -1);

		playersInGame[startingPitcher.id] = {
			p: startingPitcher,
			battingOrder: pitcherBattingOrder,
			pos: "P",
		};

		// Track the first position in the batting order with a substitution, so we can leave anyone above that unsorted
		let minBattingOrderWithSubstitution: number | undefined;

		const numPositionPlayers = this.dh
			? NUM_BATTERS_PER_SIDE
			: NUM_BATTERS_PER_SIDE - 1;
		const bench = defense.slice(numPositionPlayers);
		for (let j = 0; j < numPositionPlayers; j++) {
			const i =
				pitcherBattingOrder >= 0 && j >= pitcherBattingOrder ? j + 1 : j;
			let p = lineup[i];
			if (!p) {
				throw new Error("Not enough players");
			}

			if (p.id === -1) {
				// Pitcher was already handled above
				continue;
			}

			const pos = p.lineupPos as GamePositions<DH>;

			if (pos === "P") {
				throw new Error("Should never happen");
			}

			if (p.injured || playersInGame[p.id]) {
				// Player is injured or already in game at another position (maybe pitcher), pick someone off the bench
				const sortedBench = orderBy(
					bench,
					[(p) => (p.injured ? 1 : 0), (p) => p.ovrs[pos]],
					["asc", "desc"],
				);
				const p2 = sortedBench.find((p) => !playersInGame[p.id]);
				if (!p2) {
					throw new Error("Not enough players");
				} else {
					p = p2;
				}

				if (minBattingOrderWithSubstitution === undefined) {
					minBattingOrderWithSubstitution = i;
				}
			}

			if (p.id === -1) {
				playersInGame[startingPitcher.id] = {
					p: startingPitcher,
					battingOrder: i,
					pos: "P",
				};
			} else {
				playersInGame[p.id] = {
					p,
					battingOrder: i,
					pos,
				};
			}
		}

		// If there were subs in the starting batting order, auto sort
		if (minBattingOrderWithSubstitution !== undefined) {
			const originalBattingOrder = [];
			for (const p of Object.values(playersInGame)) {
				if (p.battingOrder >= 0) {
					originalBattingOrder[p.battingOrder] = p;
				}
			}

			// Sort only for the substituted player and after
			const newBattingOrder = [
				...originalBattingOrder.slice(0, minBattingOrderWithSubstitution),
				...orderBy(
					originalBattingOrder.slice(minBattingOrderWithSubstitution),
					(p) => lineupSort(p.p.ovrs.DH, p.p.compositeRating.speed),
					"desc",
				),
			];

			for (const [i, p] of newBattingOrder.entries()) {
				p.battingOrder = i;
			}
		}

		return playersInGame;
	}

	rebuildIndexes() {
		for (const playerInGame of Object.values(this.playersInGame)) {
			this.playersInGameByPos[playerInGame.pos] = playerInGame;
			if (playerInGame.battingOrder >= 0) {
				this.playersInGameByBattingOrder[playerInGame.battingOrder] =
					playerInGame;

				playerInGame.p.battingOrder = playerInGame.battingOrder;
			}

			if (playerInGame.p.subIndex === undefined) {
				this.subIndex += 1;
				playerInGame.p.subIndex = this.subIndex;
			}

			// If players can switch positions mid game, this doens't make sense. Would need to store an array to track all positions
			playerInGame.p.pos = playerInGame.pos;
		}
	}

	getBatter() {
		return this.playersInGameByBattingOrder[this.atBat]!;
	}

	getOnDeck() {
		return this.playersInGameByBattingOrder[
			(this.atBat + 1) % NUM_BATTERS_PER_SIDE
		]!;
	}

	advanceToNextBatter() {
		this.atBat = (this.atBat + 1) % NUM_BATTERS_PER_SIDE;
	}

	moveToPreviousBatter() {
		this.atBat -= 1;
		if (this.atBat < 0) {
			this.atBat = NUM_BATTERS_PER_SIDE - 1;
		}
	}

	getBestReliefPitcher(closerSituation: boolean):
		| {
				p: PlayerGameSim;
				value: number;
		  }
		| undefined {
		// 5 starters normally, but only 4 in the playoffs so use the last starter as a reliever, unless one of the top 4 starters is injured
		let numStartingPitchers = NUM_STARTING_PITCHERS;
		if (this.playoffs) {
			const starters = this.depth.pitchers.slice(0, NUM_STARTING_PITCHERS - 1);
			if (starters.every((p) => !p.injured)) {
				numStartingPitchers = NUM_STARTING_PITCHERS - 1;
			}
		}

		const availablePitchers = this.depth.pitchers
			.map((p, i) => ({
				starter: i < numStartingPitchers,
				p,
				index: i,
				value:
					fatigueFactor(
						p.pFatigue + p.stat.pc,
						p.compositeRating.workhorsePitcher,
					) * p.compositeRating.pitcher,
			}))
			.filter((p) => p.p.subIndex === undefined);

		const choiceWeight = (p: (typeof availablePitchers)[number]) =>
			0.01 + p.value ** 2;

		const healthyPitchers = availablePitchers.filter((p) => !p.p.injured);

		if (this.allStarGame) {
			return healthyPitchers[0];
		}

		const closer =
			healthyPitchers.find((p) => p.index === CLOSER_INDEX) ??
			healthyPitchers.find((p) => !p.starter) ??
			random.choice(healthyPitchers, choiceWeight) ??
			random.choice(availablePitchers);

		if (closerSituation) {
			return closer;
		}

		const skipCloser = Math.random() < 0.9;

		const reliever = random.choice(
			healthyPitchers.filter(
				(p) => !p.starter && (!skipCloser || p !== closer),
			),
			choiceWeight,
		);

		if (reliever) {
			return reliever;
		}

		const pitcher = random.choice(availablePitchers, choiceWeight);

		if (pitcher) {
			return pitcher;
		}

		// No pitchers available, go to position players
		const availablePitchers2 = this.depth.batters
			.map((p, i) => ({
				starter: false,
				p,
				index: i,
				value:
					fatigueFactor(
						p.pFatigue + p.stat.pc,
						p.compositeRating.workhorsePitcher,
					) * p.compositeRating.pitcher,
			}))
			.filter((p) => p.p.subIndex === undefined);

		return random.choice(availablePitchers2, choiceWeight);
	}

	getInjuryReplacement(
		pos: Exclude<Position, "SP" | "RP">,
	): PlayerGameSim | undefined {
		const availablePlayers = this.depth.batters.filter(
			(p) => p.subIndex === undefined,
		);

		let replacement;
		let maxOvr = -Infinity;
		for (const p of availablePlayers) {
			const ovr = p.ovrs[pos];
			if (ovr > maxOvr) {
				maxOvr = ovr;
				replacement = p;
			}
		}

		return replacement;
	}

	substitution(off: PlayerInGame<DH>, on: PlayerGameSim) {
		this.playersInGame[on.id] = {
			p: on,
			battingOrder: off.battingOrder,
			pos: off.pos,
		};

		delete this.playersInGame[off.p.id];

		this.rebuildIndexes();
	}
}

export default Team;
