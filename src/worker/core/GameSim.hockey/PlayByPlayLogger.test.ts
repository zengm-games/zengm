import { expect, test } from "vitest";
import PlayByPlayLogger from "./PlayByPlayLogger.ts";

test("background games retain scoring summaries with period and overtime numbers", () => {
	const loggers = [new PlayByPlayLogger(false), new PlayByPlayLogger(true)];
	for (const logger of loggers) {
		logger.logEvent({ type: "quarter", quarter: 2, clock: 20 });
		logger.logEvent({ type: "hit", clock: 19, t: 0, names: ["A", "B"] });
		logger.logEvent({
			type: "goal",
			clock: 18,
			t: 0,
			names: ["A"],
			pids: [1],
			goalType: "ev",
			shotType: "wristshot",
			totalGA: [1],
		});
		logger.logEvent({ type: "quarter", quarter: 3, clock: 20 });
		logger.logEvent({ type: "overtime", quarter: 4, clock: 5 });
		logger.logEvent({ type: "save", clock: 4, t: 1, names: ["B"] });
		logger.logEvent({
			type: "shootoutShot",
			clock: 0,
			t: 1,
			names: ["C"],
			goalieName: "B",
			made: false,
			goalType: "pn",
			shotType: "wristshot",
		});
		logger.logEvent({ type: "gameOver", clock: 0 });
	}
	const [background, live] = loggers;
	expect(background!.scoringSummary).toEqual(live!.scoringSummary);
	expect(
		background!.scoringSummary.map((event) => [event.type, event.quarter]),
	).toEqual([
		["goal", 2],
		["shootoutShot", 4],
	]);
	expect(background!.playByPlay).toEqual([]);
	expect(background!.getPlayByPlay({})).toBeUndefined();
	expect(live!.playByPlay).toHaveLength(8);
});
