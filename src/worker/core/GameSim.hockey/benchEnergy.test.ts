import { expect, test, vi } from "vitest";
import GameSim from "./index.ts";
import PenaltyBox from "./PenaltyBox.ts";
import PlayByPlayLogger from "./PlayByPlayLogger.ts";
import { penalties } from "./penalties.ts";
import type { PlayerGameSim, TeamGameSim } from "./types.ts";

const makeGame = (
	active: boolean,
	alias: "none" | "ids" | "player" | "stat",
) => {
	const players = [0, 1].map((t) =>
		Array.from(
			{ length: 9 },
			(_, i) =>
				({
					id: t * 20 + i,
					name: `Player ${t}/${i}`,
					stat: {
						min: 0,
						ppMin: 0,
						shMin: 0,
						gMin: 0,
						courtTime: 0,
						benchTime: 0,
						energy: 0.25,
						gp: 0,
						gs: 0,
						gpSkater: 0,
						gpGoalie: 0,
						shft: 0,
					},
					ovrs: { C: 50, W: 50, D: 50, G: 50 },
					compositeRating: {
						enforcer: 0.5,
						playmaker: 0.5,
						grinder: 0.5,
						blocking: 0.5,
						scoring: 0.5,
					},
				}) as unknown as PlayerGameSim,
		),
	);
	if (alias === "ids") {
		for (let i = 0; i < players[1]!.length; i++) {
			players[1]![i]!.id = players[0]![i]!.id;
		}
	} else if (alias === "player") {
		players[1]![0] = players[0]![3]!;
	} else if (alias === "stat") {
		players[1]![0]!.stat = players[0]![3]!.stat;
	}
	const game = Object.create(GameSim.prototype) as GameSim;
	game.playByPlay = new PlayByPlayLogger(active);
	game.clock = 20;
	game.allStarGame = true;
	game.synergyFactor = 1;
	game.pulledGoalie = [false, false];
	game.currentLine = [
		{ F: 0, D: 0, G: 0 },
		{ F: 0, D: 0, G: 0 },
	];
	game.minutesSinceLineChange = [
		{ F: 0, D: 0 },
		{ F: 0, D: 0 },
	];
	game.team = players.map((p) => ({
		player: p,
		stat: { min: 0, shft: 0, ptsQtrs: [0] },
		compositeRating: {},
		synergy: { reb: 0 },
	})) as unknown as [TeamGameSim, TeamGameSim];
	game.playersOnIce = [
		{ C: [], W: [], D: [], G: [] },
		{ C: [], W: [], D: [], G: [] },
	];
	game.lines = players.map((p) => ({
		F: [p.slice(0, 3), p.slice(3, 6), p.slice(0, 3), p.slice(3, 6)],
		D: [p.slice(6, 8), p.slice(6, 8), p.slice(6, 8)],
		G: [[p[8]!]],
	})) as GameSim["lines"];
	game.penaltyBox = new PenaltyBox(({ t, p }) =>
		game.updatePlayersOnIce({ type: "penaltyOver", t, p }),
	);
	game.updatePlayersOnIce({ type: "starters" });
	return game;
};

// Independent energy-only reference for the original per-clock roster scan.
// Preserve its team order and ID-based membership, including aliases.
const checkEnergy = (game: GameSim, minutes: number) => {
	const expected = new Map<PlayerGameSim["stat"], number>();
	for (const team of game.team) {
		for (const p of team.player) {
			expected.set(p.stat, p.stat.energy);
		}
	}
	const onField = new Set<number>();
	for (const t of [0, 1] as const) {
		for (const line of Object.values(game.playersOnIce[t])) {
			for (const p of line) {
				onField.add(p.id);
				let value = expected.get(p.stat)! + -0.25 * minutes;
				if (value < 0) {
					value = 0;
				}
				expected.set(p.stat, value);
			}
		}
		for (const p of game.team[t].player) {
			if (!onField.has(p.id)) {
				expected.set(p.stat, 1);
			}
		}
	}
	game.updatePlayingTime(minutes);
	for (const [stat, energy] of expected) {
		expect(stat.energy).toBe(energy);
	}
};

test("bench recovery preserves repeated and zero-duration updates with duplicate IDs and shared stats", () => {
	for (const active of [false, true]) {
		for (const alias of ["none", "ids", "player", "stat"] as const) {
			const game = makeGame(active, alias);
			for (const minutes of [0, 0.2, 0.2, 0, 0.7, -0.1, Number.NaN, 0.3]) {
				checkEnergy(game, minutes);
			}
		}
	}
});

test("bench recovery follows every lineup-changing event and standalone line changes", () => {
	const random = vi.spyOn(Math, "random").mockReturnValue(0.1);
	try {
		for (const active of [false, true]) {
			const game = makeGame(active, "none");
			const check = () => {
				checkEnergy(game, 0);
				checkEnergy(game, 0.25);
				checkEnergy(game, 0.25);
			};
			check();
			game.minutesSinceLineChange = [
				{ F: 2, D: 2 },
				{ F: 2, D: 2 },
			];
			game.updatePlayersOnIce({ type: "normal" });
			check();
			game.updatePlayersOnIce({ type: "newPeriod" });
			check();
			game.updatePlayersOnIce({ type: "pullGoalie", t: 0 });
			check();
			game.updatePlayersOnIce({ type: "noPullGoalie", t: 0 });
			check();
			game.penaltyBox.add(
				0,
				game.playersOnIce[0].C[0]!,
				penalties.find((p) => p.type === "minor")!,
			);
			game.updatePlayersOnIce({ type: "penalty" });
			check();
			game.penaltyBox.advanceClock(3);
			check();
			game.doLineChange(1, "F", [
				...game.playersOnIce[1].D,
				...game.playersOnIce[1].G,
			]);
			check();
		}
	} finally {
		random.mockRestore();
	}
});
