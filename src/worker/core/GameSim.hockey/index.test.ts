import { describe, expect, test } from "vitest";
import GameSim from "./index.ts";
import PlayByPlayLogger from "./PlayByPlayLogger.ts";
import type { PlayerGameSim, PlayersOnIce, TeamGameSim } from "./types.ts";

const makePlayer = (id: number, faceoffs = 0.5) =>
	({
		id,
		stat: {
			min: 0.1,
			ppMin: 0,
			shMin: 0,
			gMin: 0,
			courtTime: 0,
			benchTime: 0,
			energy: 0.1,
		},
		compositeRating: { faceoffs },
	}) as PlayerGameSim;

const makeGame = (active: boolean, counts: [number, number]) => {
	const game = Object.create(GameSim.prototype) as GameSim;
	game.playByPlay = new PlayByPlayLogger(active);
	game.penaltyBox = { count: (t: 0 | 1) => counts[t] } as GameSim["penaltyBox"];
	const teams = [0, 1].map((tid) => {
		const players = Array.from({ length: 5 }, (_, i) =>
			makePlayer(tid * 5 + i),
		);
		return { player: players, stat: { min: 0.1 } } as TeamGameSim;
	}) as [TeamGameSim, TeamGameSim];
	game.team = teams;
	game.playersOnIce = teams.map((t) => ({
		C: [t.player[0]!],
		W: [t.player[1]!],
		D: [t.player[2]!],
		G: [t.player[3]!],
	})) as [PlayersOnIce, PlayersOnIce];
	return game;
};

describe("playing time", () => {
	test.each([
		{ counts: [0, 0], strength: ["ev", "ev"] },
		{ counts: [1, 0], strength: ["sh", "pp"] },
		{ counts: [0, 2], strength: ["pp", "sh"] },
		{ counts: [1, 1], strength: ["ev", "ev"] },
	] as const)(
		"records minutes at penalty counts $counts",
		({ counts, strength }) => {
			for (const active of [false, true]) {
				const game = makeGame(active, [...counts]);
				game.updatePlayingTime(0.5);
				const expectedEvents = [];
				for (const t of [0, 1] as const) {
					const players = game.team[t].player;
					expect(game.team[t].stat.min).toBe(2.1);
					for (let i = 0; i < 4; i++) {
						const p = players[i]!;
						expect(p.stat).toEqual({
							min: 0.6,
							ppMin: strength[t] === "pp" ? 0.5 : 0,
							shMin: strength[t] === "sh" ? 0.5 : 0,
							gMin: i === 3 ? 0.5 : 0,
							courtTime: 0.5,
							benchTime: 0,
							energy: 0,
						});
						const stats = ["min"];
						if (strength[t] !== "ev") {
							stats.push(`${strength[t]}Min`);
						}
						if (i === 3) {
							stats.push("gMin");
						}
						for (const s of stats) {
							expectedEvents.push({ type: "stat", t, pid: p.id, s, amt: 0.5 });
						}
					}
					expect(players[4]!.stat).toEqual({
						min: 0.1,
						ppMin: 0,
						shMin: 0,
						gMin: 0,
						courtTime: 0,
						benchTime: 0.5,
						energy: 1,
					});
				}
				expect(game.playByPlay.playByPlay).toEqual(
					active ? expectedEvents : [],
				);
			}
		},
	);
});

describe("faceoff player selection", () => {
	test("accounts for fatigue and keeps position order when ratings tie", () => {
		const game = makeGame(false, [0, 0]);
		const [center, winger, defender, goalie] = game.team[0].player;
		center!.compositeRating.faceoffs = 1;
		winger!.stat.energy = 1;
		defender!.stat.energy = 1;
		goalie!.compositeRating.faceoffs = 100;
		expect(game.getTopPlayerOnIce(0, "faceoffs", ["D", "W", "C"])).toBe(winger);
		defender!.compositeRating.faceoffs = 0.6;
		expect(game.getTopPlayerOnIce(0, "faceoffs", ["C", "W", "D"])).toBe(
			defender,
		);
	});

	test("preserves an undefined result when no eligible player is on the ice", () => {
		const game = makeGame(false, [0, 0]);
		game.playersOnIce[0].G = [];
		expect(game.getTopPlayerOnIce(0, "faceoffs", ["G"])).toBeUndefined();
	});

	test("preserves the original stable-sort behavior for malformed ratings", () => {
		const game = makeGame(false, [0, 0]);
		const center = game.playersOnIce[0].C[0]!;
		center.compositeRating.faceoffs = Number.NaN;
		expect(game.getTopPlayerOnIce(0, "faceoffs")).toBe(center);
	});
});
