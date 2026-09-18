import { expect, test, vi } from "vitest";
import PenaltyBox from "./PenaltyBox.ts";
import { penalties } from "./penalties.ts";
import type { PlayerGameSim } from "./types.ts";

const minor = penalties.find((penalty) => penalty.type === "minor")!;

test("an empty penalty box does not split elapsed time or emit penalty events", () => {
	const onPenaltyOver = vi.fn();
	const box = new PenaltyBox(onPenaltyOver);
	expect(box.splitUpAdvanceClock(0.25)).toEqual([0.25]);
	expect(box.splitUpAdvanceClock(0)).toEqual([0]);
	box.advanceClock(0.25);
	expect(onPenaltyOver).not.toHaveBeenCalled();
	expect(box.getPowerPlayTeam()).toEqual({
		powerPlayTeam: undefined,
		strengthDifference: 0,
	});
});

test("penalties split playing time at expiration and retain power-play opportunities", () => {
	const onPenaltyOver = vi.fn();
	const box = new PenaltyBox(onPenaltyOver);
	const p = { id: 1 } as PlayerGameSim;
	box.add(0, p, minor);
	expect(box.splitUpAdvanceClock(2.5)).toEqual([2, 0.5]);
	box.advanceClock(1.5);
	expect(onPenaltyOver).not.toHaveBeenCalled();
	box.advanceClock(0.5);
	expect(onPenaltyOver).toHaveBeenCalledExactlyOnceWith({
		t: 0,
		p,
		minutesAgo: -0,
		ppo: 1,
	});
	expect(box.count(0)).toBe(0);
	box.advanceClock(0.5);
	expect(onPenaltyOver).toHaveBeenCalledTimes(1);
});

test("simultaneous offsetting penalties preserve callback order without power plays", () => {
	const onPenaltyOver = vi.fn();
	const box = new PenaltyBox(onPenaltyOver);
	const players = [{ id: 1 }, { id: 2 }] as PlayerGameSim[];
	box.add(0, players[0]!, minor);
	box.add(1, players[1]!, minor);
	expect(box.splitUpAdvanceClock(2.5)).toEqual([2, 0.5]);
	box.advanceClock(2.5);
	expect(onPenaltyOver.mock.calls).toEqual([
		[{ t: 0, p: players[0], minutesAgo: 0.5, ppo: 0 }],
		[{ t: 1, p: players[1], minutesAgo: 0.5, ppo: 0 }],
	]);
});
