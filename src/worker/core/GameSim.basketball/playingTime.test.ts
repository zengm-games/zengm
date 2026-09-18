import { expect, test } from "vitest";
import GameSim from "./index.ts";
import PlayByPlayLogger from "./PlayByPlayLogger.ts";

test.each([false, true])(
	"playing time preserves player/team totals and live logging (%s)",
	(active) => {
		const game = Object.create(GameSim.prototype) as GameSim;
		game.fatigueFactor = 0.04;
		game.playByPlay = new PlayByPlayLogger(active);
		game.team = [0, 1].map((tid) => ({
			player: Array.from({ length: 7 }, (_, i) => ({
				id: tid * 10 + i,
				stat: {
					min: 0.1,
					courtTime: 1,
					benchTime: 2,
					energy: i < 3 ? 0.001 : 0.99,
				},
				compositeRating: { endurance: 0 },
			})),
			stat: { min: 0.1 },
		})) as unknown as GameSim["team"];
		game.playersOnCourt = game.team.map((t) =>
			t.player.slice(0, 3),
		) as GameSim["playersOnCourt"];
		game.updatePlayingTime(30);
		const expectedEvents = [];
		for (const t of [0, 1] as const) {
			expect(game.team[t].stat.min).toBe(0.1 + 0.5 + 0.5 + 0.5);
			for (const [i, p] of game.team[t].player.entries()) {
				expect(p.stat).toEqual(
					i < 3
						? { min: 0.6, courtTime: 1.5, benchTime: 2, energy: 0 }
						: { min: 0.1, courtTime: 1, benchTime: 2.5, energy: 1 },
				);
				if (i < 3) {
					expectedEvents.push({
						type: "stat",
						t,
						pid: p.id,
						s: "min",
						amt: 0.5,
					});
				}
			}
		}
		const events = game.playByPlay.getPlayByPlay({});
		if (active) {
			expect(events?.filter((event) => event.type === "stat")).toEqual(
				expectedEvents,
			);
		} else {
			expect(events).toBeUndefined();
		}
	},
);
